import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
import type { createClient as createClientType } from "@/lib/supabase/server"

/**
 * POST /api/re-analyze
 *
 * Re-runs the full analysis pipeline for an existing job.
 * Accepts { job_id } and uses the job's stored job_url to re-fetch and re-analyze.
 *
 * FIX (2026-05-29): Deletes are now deferred until AFTER successful AI extraction.
 * Previously, stale rows were deleted before the AI call — a failed extraction left
 * the job with score data on the jobs row but empty job_analyses/job_scores, creating
 * a "79/100 but Analysis not run yet" contradiction that caused an infinite loop.
 *
 * FIX (2026-05-29): Model fallback — tries SONNET first, falls back to HAIKU on 403.
 * The v0 preview AI gateway returns 403 for claude-sonnet-4; HAIKU is accessible.
 */

type ServerSupabase = Awaited<ReturnType<typeof createClientType>>

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

/**
 * Attempt AI extraction with SONNET, falling back to HAIKU on 403.
 * The v0 preview gateway blocks claude-sonnet-4 with a 403 — HAIKU is accessible.
 */
async function extractWithFallback(
  pageContent: string
): Promise<z.infer<typeof JobAnalysisSchema>> {
  const prompt = `Analyze this job posting and extract structured information.\n\nJob posting:\n${pageContent}`

  const modelsToTry = [CLAUDE_MODELS.SONNET, CLAUDE_MODELS.HAIKU] as const

  let lastError: Error | null = null
  for (const model of modelsToTry) {
    try {
      const result = await generateText({
        model,
        output: Output.object({ schema: JobAnalysisSchema }),
        prompt,
      })
      return result.experimental_output!
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      const is403 = err.message.includes("403") || err.message.includes("Forbidden") || err.message.includes("Access denied")
      lastError = err
      if (!is403) throw err // Non-403 errors propagate immediately — don't try fallback
      console.warn(`[re-analyze] Model ${model} returned 403, trying fallback`)
    }
  }
  throw lastError ?? new Error("All models failed")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id } = body

    if (!job_id || typeof job_id !== "string") {
      return NextResponse.json({ success: false, error: "job_id is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

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

    // Mark analyzing so the UI shows a loading state — does NOT delete anything yet.
    await supabase
      .from("jobs")
      .update({ status: "analyzing" })
      .eq("id", job_id)
      .eq("user_id", user.id)

    const result = await reAnalyzeExistingJob(job.job_url, job_id, supabase, user, request)

    if (!result.success) {
      // Restore previous status. Existing analysis rows are untouched (never deleted).
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

async function reAnalyzeExistingJob(
  jobUrl: string,
  jobId: string,
  supabase: ServerSupabase,
  user: User,
  requestLike: { headers: { get(name: string): string | null } }
): Promise<{ success: true; job: unknown } | { success: false; error: string }> {

  // ── Step 1: Fetch the job page ───────────────────────────────────────────
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
    pageContent = parseJobPage(html, jobUrl).text
  } catch (e) {
    return { success: false, error: `Failed to fetch job page: ${e instanceof Error ? e.message : "unknown"}` }
  }

  // ── Step 2: AI extraction — SONNET with HAIKU fallback on 403 ───────────
  // CRITICAL: Do NOT delete existing rows until extraction succeeds.
  // If we delete first and the AI call fails, the job is left with a score on
  // the jobs row but empty job_analyses — creating a broken loop state.
  let analysis: z.infer<typeof JobAnalysisSchema>
  try {
    analysis = await extractWithFallback(pageContent)
  } catch (e) {
    return { success: false, error: `AI extraction failed: ${e instanceof Error ? e.message : "unknown"}` }
  }

  // ── Step 3: AI succeeded — NOW safe to delete stale rows ────────────────
  await Promise.all([
    supabase.from("job_analyses").delete().eq("job_id", jobId).eq("user_id", user.id),
    supabase.from("job_scores").delete().eq("job_id", jobId),
  ])

  const title = analysis.title || "Unknown Position"
  const company = analysis.company || "Unknown Company"
  const seniority = normalizeSeniority(analysis.seniority_level)

  // ── Step 4: Score against evidence ──────────────────────────────────────
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
    canonicalEvidence.some((e) =>
      e.skills.some((s) => s.toLowerCase().includes(t.toLowerCase())) ||
      e.text.toLowerCase().includes(t.toLowerCase())
    )
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

  const gaps = explainableFit.gaps
    .filter((g) => g.severity === "critical")
    .slice(0, 5)
    .map((g) => `Gap: ${g.requirement.slice(0, 80)}`)
  const strengths = explainableFit.strengths
    .slice(0, 5)
    .map((s) => `Strong: ${s.requirement.slice(0, 80)}`)

  // ── Step 5: Write results ────────────────────────────────────────────────
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

  if (updateError) return { success: false, error: "Failed to update job record" }

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
    matched_skills: strengths.filter((r: string) => !r.startsWith("Gap:")),
    known_gaps: gaps.filter((r: string) => r.startsWith("Gap:")),
    analysis_version: "3.0-explainable",
    analysis_model: "claude-haiku-fallback",
  })
  if (analysisError) console.error("[re-analyze] Analysis insert error:", analysisError)

  const { error: scoresError } = await supabase.from("job_scores").insert({
    job_id: jobId,
    overall_score: explainableFit.score,
    confidence_score: explainableFit.confidence === "HIGH" ? 0.9 : explainableFit.confidence === "MEDIUM" ? 0.7 : 0.5,
    skills_match: dimensionScores.skills,
    experience_relevance: dimensionScores.experience,
    evidence_quality: dimensionScores.evidence,
    seniority_alignment: dimensionScores.seniority,
    ats_keywords: dimensionScores.ats,
    scoring_version: "3.0-explainable",
  })
  if (scoresError) console.error("[re-analyze] Scores insert error:", scoresError)

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
