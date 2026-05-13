import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeJobCore } from "@/lib/analyze/analyze-job-core"

/**
 * POST /api/re-analyze
 *
 * Re-runs the full analysis pipeline for an existing job.
 * Accepts { job_id } and uses the job's stored source_url (job_url) to re-fetch
 * and re-analyze. Falls back gracefully if re-fetch is unavailable.
 *
 * This is distinct from /api/analyze which CREATES a new job from a URL.
 * re-analyze UPDATES an existing job that already has a job_url in the DB.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id } = body

    if (!job_id || typeof job_id !== "string") {
      return NextResponse.json(
        { success: false, error: "job_id is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the existing job to get its URL
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, job_url, status")
      .eq("id", job_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    if (!job.job_url) {
      return NextResponse.json(
        { success: false, error: "This job has no URL to re-analyze. Add a job URL first." },
        { status: 400 }
      )
    }

    // Mark the job as analyzing so the UI shows a loading state
    await supabase
      .from("jobs")
      .update({ status: "analyzing" })
      .eq("id", job_id)
      .eq("user_id", user.id)

    // Delete any stale analysis/scores rows so re-insert works cleanly
    await Promise.all([
      supabase.from("job_analyses").delete().eq("job_id", job_id).eq("user_id", user.id),
      supabase.from("job_scores").delete().eq("job_id", job_id),
    ])

    // Run analyzeJobCore — it will find the existing job by URL and return early
    // with the duplicate response, so we bypass that by deleting first then calling
    // the core function differently. Instead, we call the HTTP analyze endpoint
    // logic directly, bypassing duplicate detection for re-analysis.
    const result = await reAnalyzeExistingJob(job.job_url, job_id, supabase, user, request)

    if (!result.success) {
      // Restore the previous status on failure
      await supabase
        .from("jobs")
        .update({ status: "analyzed" })
        .eq("id", job_id)
        .eq("user_id", user.id)

      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, job_id, job: result.job })
  } catch (error) {
    console.error("Error in re-analyze:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Re-analysis failed" },
      { status: 500 }
    )
  }
}

// ─── Internal re-analyze function ───────────────────────────────────────────
// Skips duplicate detection since we know this job already exists.
// Reuses the full extraction + scoring + backfill logic from analyzeJobCore
// by calling it with the job_url — but the job row already exists so we need
// to update rather than insert. We achieve this by temporarily removing the
// job_url from the row, calling analyzeJobCore (which creates a new row), then
// merging the result back and deleting the duplicate.
//
// Simpler approach: just call the shared extraction logic directly.

import { generateText, Output } from "ai"
import { z } from "zod"
import {
  normalizeEvidenceRecord,
  normalizeProfileExperience,
  calculateExplainableFit,
  type CanonicalEvidence,
  type FitBand,
} from "@/lib/canonical-evidence"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"
import { parseJobPage } from "@/lib/parsers"
import {
  inferRoleFromJobTitle,
  getWeightsForRole,
  calculateWeightedScore,
} from "@/lib/scoring-weights"
import { runJobFlow } from "@/lib/orchestrator/runJobFlow"
import type { User } from "@supabase/supabase-js"
type ServerSupabase = Awaited<ReturnType<typeof createClient>>

const ROLE_FAMILIES = [
  "AI Technical Product Manager", "Technical Product Manager", "AI Product Manager",
  "Product Manager", "Senior Product Manager", "Systems Product Manager",
  "Workflow Product Manager", "Analytics Product Manager", "Product Owner",
  "Program Manager", "Other",
] as const

const JobAnalysisSchema = z.object({
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  employment_type: z.string().nullable(),
  salary_text: z.string().nullable(),
  description_summary: z.string().nullable(),
  responsibilities: z.array(z.string()),
  qualifications_required: z.array(z.string()),
  qualifications_preferred: z.array(z.string()),
  keywords: z.array(z.string()),
  ats_phrases: z.array(z.string()),
  tech_stack: z.array(z.string()),
  role_family: z.enum(ROLE_FAMILIES),
  industry_guess: z.string().nullable(),
  seniority_level: z.string().nullable(),
  fit_signals: z.object({
    has_ai_focus: z.boolean(),
    has_technical_requirements: z.boolean(),
    has_workflow_focus: z.boolean(),
    has_startup_culture: z.boolean(),
    has_pure_engineering: z.boolean(),
    has_people_management: z.boolean(),
    product_ownership_level: z.enum(["low", "medium", "high"]),
  }),
})

function normalizeSeniority(level: string | null): string {
  if (!level) return "Mid"
  const lower = level.toLowerCase()
  if (lower.includes("entry") || lower.includes("junior")) return "Entry"
  if (lower.includes("senior") || lower.includes("sr.")) return "Senior"
  if (lower.includes("lead") || lower.includes("principal")) return "Lead"
  if (lower.includes("director")) return "Director"
  if (lower.includes("vp") || lower.includes("vice president")) return "VP"
  return "Mid"
}

async function reAnalyzeExistingJob(
  jobUrl: string,
  jobId: string,
  supabase: ServerSupabase,
  user: User,
  requestLike: { headers: { get(name: string): string | null } }
): Promise<{ success: true; job: unknown } | { success: false; error: string }> {
  // Fetch page
  let pageContent: string
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 30000)
    const response = await fetch(jobUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    const parsed = parseJobPage(html, jobUrl)
    pageContent = parsed.text
  } catch (e) {
    return { success: false, error: `Failed to fetch: ${e instanceof Error ? e.message : "unknown"}` }
  }

  // Extract with Claude
  let analysis: z.infer<typeof JobAnalysisSchema>
  try {
    const result = await generateText({
      model: CLAUDE_MODELS.SONNET,
      output: Output.object({ schema: JobAnalysisSchema }),
      prompt: `Analyze this job posting and extract structured information.\n\nJob posting:\n${pageContent}`,
    })
    analysis = result.experimental_output!
  } catch (e) {
    return { success: false, error: `AI extraction failed: ${e instanceof Error ? e.message : "unknown"}` }
  }

  const title = analysis.title || "Unknown Position"
  const company = analysis.company || "Unknown Company"
  const seniority = normalizeSeniority(analysis.seniority_level)

  // Load evidence for scoring
  const [evidenceResult, profileResult] = await Promise.all([
    supabase.from("evidence_library").select("*").eq("user_id", user.id).eq("is_active", true),
    supabase.from("user_profile").select("*").eq("user_id", user.id).maybeSingle(),
  ])

  const canonicalEvidence: CanonicalEvidence[] = []
  if (evidenceResult.data) {
    for (const record of evidenceResult.data) canonicalEvidence.push(normalizeEvidenceRecord(record))
  }
  if (profileResult.data?.experience) {
    const exps = Array.isArray(profileResult.data.experience) ? profileResult.data.experience : []
    for (const exp of exps) canonicalEvidence.push(...normalizeProfileExperience(exp, user.id))
  }

  const techMatch = analysis.tech_stack.filter((t) =>
    canonicalEvidence.some((e) => e.skills.some((s) => s.toLowerCase().includes(t.toLowerCase())) || e.text.toLowerCase().includes(t.toLowerCase()))
  )
  const kwMatch = analysis.keywords.filter((k) =>
    canonicalEvidence.some((e) => e.text.toLowerCase().includes(k.toLowerCase()))
  )

  const dimensionScores = {
    experience: canonicalEvidence.filter((e) => e.evidence_type === "work_experience").length > 0 ? 70 : 40,
    evidence: Math.min(100, (canonicalEvidence.filter((e) => e.confidence === "high").length / Math.max(canonicalEvidence.length, 1)) * 100),
    skills: techMatch.length > 0 ? Math.min(100, (techMatch.length / Math.max(analysis.tech_stack.length, 1)) * 100) : 40,
    seniority: seniority === "Senior" || seniority === "Lead" ? 70 : 50,
    ats: kwMatch.length > 0 ? Math.min(100, (kwMatch.length / Math.max(analysis.keywords.length, 1)) * 100) : 40,
  }

  const inferredRole = inferRoleFromJobTitle(title)
  const weights = getWeightsForRole(inferredRole)
  calculateWeightedScore({
    experience_relevance: dimensionScores.experience,
    evidence_quality: dimensionScores.evidence,
    skills_match: dimensionScores.skills,
    seniority_alignment: dimensionScores.seniority,
    ats_keywords: dimensionScores.ats,
  }, weights)

  const explainableFit = calculateExplainableFit(
    canonicalEvidence,
    analysis.qualifications_required,
    analysis.qualifications_preferred,
    dimensionScores
  )

  const fitBandToLegacy: Record<FitBand, "HIGH" | "MEDIUM" | "LOW"> = {
    strong_match: "HIGH", moderate_match: "MEDIUM", stretch_but_viable: "MEDIUM", low_match: "LOW",
  }

  // Prefix format must match the /^Gap:/i regex used in analyzeJobCore and job_analyses inserts.
  const gaps = explainableFit.gaps.filter((g) => g.severity === "critical").slice(0, 5).map((g) => `Gap: ${g.requirement.slice(0, 80)}`)
  const strengths = explainableFit.strengths.slice(0, 5).map((s) => `Strong: ${s.requirement.slice(0, 80)}`)

  // Update the existing jobs row
  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      role_title: title,
      company_name: company,
      status: "analyzed",
      qualifications_required: analysis.qualifications_required,
      responsibilities: analysis.responsibilities,
      score: explainableFit.score,
      fit: fitBandToLegacy[explainableFit.band],
      score_gaps: gaps,
      score_strengths: strengths,
      seniority_level: seniority,
      role_family: analysis.role_family,
      location: analysis.location,
      industry_guess: analysis.industry_guess,
      ats_keywords: analysis.keywords,
      job_description: pageContent.slice(0, 10000),
    })
    .eq("id", jobId)
    .eq("user_id", user.id)

  if (updateError) return { success: false, error: "Failed to update job" }

  // Insert fresh analysis record
  const { error: analysisError } = await supabase.from("job_analyses").insert({
    user_id: user.id,
    job_id: jobId,
    title,
    company,
    location: analysis.location,
    employment_type: analysis.employment_type,
    salary_text: analysis.salary_text,
    description_raw: pageContent.slice(0, 10000),
    responsibilities: analysis.responsibilities,
    qualifications_required: analysis.qualifications_required,
    qualifications_preferred: analysis.qualifications_preferred,
    keywords: analysis.keywords,
    ats_phrases: analysis.ats_phrases,
    matched_skills: strengths.filter((r: string) => !/^Gap:/i.test(r)),
    known_gaps: gaps.filter((r: string) => /^Gap:/i.test(r)),
    analysis_version: "3.0-explainable",
    analysis_model: "claude-sonnet",
  })
  if (analysisError) console.error("Analysis insert error:", analysisError)

  // Insert fresh scores record
  const { error: scoresError } = await supabase.from("job_scores").insert({
    job_id: jobId,
    overall_score: explainableFit.score,
    confidence_score: explainableFit.confidence === "high" ? 0.9 : explainableFit.confidence === "medium" ? 0.7 : 0.5,
    skills_match: dimensionScores.skills,
    experience_relevance: dimensionScores.experience,
    evidence_quality: dimensionScores.evidence,
    seniority_alignment: dimensionScores.seniority,
    ats_keywords: dimensionScores.ats,
    scoring_version: "3.0-explainable",
  })
  if (scoresError) console.error("Scores insert error:", scoresError)

  // Run orchestration (coaching, matching, etc.)
  await runJobFlow({
    supabase,
    request: requestLike,
    userId: user.id,
    jobId,
    triggerInterviewPrep: false,
  })

  const { data: updatedJob } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single()

  return { success: true, job: updatedJob }
}
