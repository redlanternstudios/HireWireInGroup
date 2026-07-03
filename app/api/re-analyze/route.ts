import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeJobCore } from "@/lib/analyze/analyze-job-core"
import { handleDomainEvent } from "@/lib/domain-events"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { requireUser } from "@/lib/supabase/require-user"

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
  let recoveryJobId: string | null = null
  let recoveryStatus = "analyzed"
  try {
    const body = await request.json()
    const { job_id } = body

    if (!job_id || typeof job_id !== "string") {
      return NextResponse.json(
        { success: false, error: "job_id is required" },
        { status: 400 }
      )
    }
    recoveryJobId = job_id

    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    // Fetch the existing job to get its URL
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, job_url, job_description, status, role_title, company_name")
      .eq("id", job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }
    recoveryStatus = job.status || "analyzed"

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
      .eq("user_id", userId)

    // Run analyzeJobCore — it will find the existing job by URL and return early
    // with the duplicate response, so we bypass that by deleting first then calling
    // the core function differently. Instead, we call the HTTP analyze endpoint
    // logic directly, bypassing duplicate detection for re-analysis.
    const result = await reAnalyzeExistingJob(job.job_url, job_id, supabase, userId, {
      roleTitle: job.role_title,
      companyName: job.company_name,
      jobDescription: job.job_description,
    })

    if (!result.success) {
      // Restore the previous status on failure
      await supabase
        .from("jobs")
        .update({ status: "analyzed" })
        .eq("id", job_id)
        .eq("user_id", userId)

      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // Emit domain event — best effort, never blocks the response
    await handleDomainEvent({
      supabase,
      event_type: "job_analyzed",
      job_id,
      user_id: userId,
      source: "analyze_job_route",
      payload: { triggeredAt: new Date().toISOString(), reanalysis: true },
    })

    const readiness =
      result.job && typeof result.job === "object"
        ? evaluateReadiness(result.job)
        : null

    return NextResponse.json({
      success: true,
      job_id,
      job: result.job,
      nextAction: readiness?.nextAction ?? null,
    })
  } catch (error) {
    console.error("Error in re-analyze:", error)
    if (recoveryJobId) {
      const recoveryAuth = await requireUser()
      if (recoveryAuth.ok) {
        await recoveryAuth.supabase
          .from("jobs")
          .update({ status: recoveryStatus })
          .eq("id", recoveryJobId)
          .eq("user_id", recoveryAuth.userId)
      }
    }
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

import { generateStructuredText, CLAUDE_MODELS } from "@/lib/ai/gateway"
import { z } from "zod"
import {
  normalizeEvidenceRecord,
  normalizeProfileExperience,
  calculateExplainableFit,
  type CanonicalEvidence,
  type FitBand,
} from "@/lib/canonical-evidence"
import { parseJobPage } from "@/lib/parsers"
import {
  inferRoleFromJobTitle,
  getWeightsForRole,
  calculateWeightedScore,
} from "@/lib/scoring-weights"
import { runJobFlow } from "@/lib/orchestrator/runJobFlow"
type ServerSupabase = Awaited<ReturnType<typeof createClient>>

const ROLE_FAMILIES = [
  "AI Technical Product Manager", "Technical Product Manager", "AI Product Manager",
  "Product Manager", "Senior Product Manager", "Systems Product Manager",
  "Workflow Product Manager", "Analytics Product Manager", "Product Owner",
  "Program Manager", "Other",
] as const

const SOC_CATEGORIES = [
  "Management",
  "Business_Financial",
  "Computer_Mathematical",
  "Architecture_Engineering",
  "Life_Physical_Social_Science",
  "Community_Social_Services",
  "Legal",
  "Education_Library",
  "Arts_Design_Entertainment_Sports_Media",
  "Healthcare_Practitioners",
  "Healthcare_Support",
  "Protective_Service",
  "Food_Preparation_Serving",
  "Building_Grounds",
  "Personal_Care_Service",
  "Sales",
  "Office_Administrative",
  "Farming_Fishing_Forestry",
  "Construction_Extraction",
  "Installation_Maintenance_Repair",
  "Production",
  "Transportation_Material_Moving",
  "Military",
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
  soc_major_group: z.number().int().min(11).max(55).nullable(),
  soc_group_name: z.string().nullable(),
  soc_category: z.enum(SOC_CATEGORIES).nullable(),
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
  userId: string,
  existingIdentity: {
    roleTitle?: string | null
    companyName?: string | null
    jobDescription?: string | null
  },
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

  const fetchedListingInsteadOfJob =
    pageContent.length < 300 ||
    /today'?s top \d[\d,+]* .* jobs in/i.test(pageContent) ||
    /leverage your professional network, and get hired/i.test(pageContent)
  if (fetchedListingInsteadOfJob) {
    const savedDescription = existingIdentity.jobDescription?.trim() ?? ""
    if (savedDescription.length < 300) {
      return {
        success: false,
        error: "The source returned a job search listing instead of the saved job posting. The existing analysis was preserved.",
      }
    }
    pageContent = savedDescription
  }

  // Extract structured data through the canonical AI Gateway
  let analysis: z.infer<typeof JobAnalysisSchema>
  try {
    analysis = await generateStructuredText({
      model: CLAUDE_MODELS.SONNET,
      schema: JobAnalysisSchema,
      contextPrompt: `Analyze this job posting:\n\n${pageContent.slice(0, 12000)}`,
      schemaDescription: `{
  "title": string | null,
  "company": string | null,
  "location": string | null,
  "employment_type": string | null,
  "salary_text": string | null,
  "description_summary": string | null,
  "responsibilities": string[],
  "qualifications_required": string[],
  "qualifications_preferred": string[],
  "keywords": string[],
  "ats_phrases": string[],
  "tech_stack": string[],
  "role_family": "AI Technical Product Manager"|"Technical Product Manager"|"AI Product Manager"|"Product Manager"|"Senior Product Manager"|"Systems Product Manager"|"Workflow Product Manager"|"Analytics Product Manager"|"Product Owner"|"Program Manager"|"Other",
  "soc_major_group": number | null,
  "soc_group_name": string | null,
  "soc_category": "Management"|"Business_Financial"|"Computer_Mathematical"|"Architecture_Engineering"|"Life_Physical_Social_Science"|"Community_Social_Services"|"Legal"|"Education_Library"|"Arts_Design_Entertainment_Sports_Media"|"Healthcare_Practitioners"|"Healthcare_Support"|"Protective_Service"|"Food_Preparation_Serving"|"Building_Grounds"|"Personal_Care_Service"|"Sales"|"Office_Administrative"|"Farming_Fishing_Forestry"|"Construction_Extraction"|"Installation_Maintenance_Repair"|"Production"|"Transportation_Material_Moving"|"Military" | null,
  "industry_guess": string | null,
  "seniority_level": string | null,
  "fit_signals": {
    "has_ai_focus": boolean,
    "has_technical_requirements": boolean,
    "has_workflow_focus": boolean,
    "has_startup_culture": boolean,
    "has_pure_engineering": boolean,
    "has_people_management": boolean,
    "product_ownership_level": "low"|"medium"|"high"
  }
}`,
    }, { route: "re-analyze", operation: "job-analysis" })
  } catch (e) {
    return { success: false, error: `AI extraction failed: ${e instanceof Error ? e.message : "unknown"}` }
  }

  const title = analysis.title || "Unknown Position"
  const company = analysis.company || "Unknown Company"
  const normalizedExistingTitle = String(existingIdentity.roleTitle ?? "").toLowerCase()
  const normalizedNextTitle = title.toLowerCase()
  const existingTitleTokens = normalizedExistingTitle.split(/\W+/).filter((token) => token.length > 2)
  const titleStillMatches =
    existingTitleTokens.length === 0 ||
    existingTitleTokens.some((token) => normalizedNextTitle.includes(token))
  if (
    title === "Unknown Position" ||
    company === "Unknown Company" ||
    !titleStillMatches
  ) {
    return {
      success: false,
      error: "The fetched posting identity did not match the saved job. The existing analysis was preserved.",
    }
  }
  const seniority = normalizeSeniority(analysis.seniority_level)

  // Load evidence for scoring
  const [evidenceResult, profileResult] = await Promise.all([
    supabase.from("evidence_library").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("user_profile").select("*").eq("user_id", userId).maybeSingle(),
  ])

  const canonicalEvidence: CanonicalEvidence[] = []
  if (evidenceResult.data) {
    for (const record of evidenceResult.data) canonicalEvidence.push(normalizeEvidenceRecord(record))
  }
  if (profileResult.data?.experience) {
    const exps = Array.isArray(profileResult.data.experience) ? profileResult.data.experience : []
    for (const exp of exps) canonicalEvidence.push(...normalizeProfileExperience(exp, userId))
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
  const weights = getWeightsForRole(inferredRole, analysis.soc_category ?? undefined)
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
    dimensionScores,
    weights
  )

  const fitBandToLegacy: Record<FitBand, "HIGH" | "MEDIUM" | "LOW"> = {
    strong_match: "HIGH", moderate_match: "MEDIUM", stretch_but_viable: "MEDIUM", low_match: "LOW",
  }

  // Prefix format must match the /^Gap:/i regex used in analyzeJobCore and job_analyses inserts.
  const gaps = explainableFit.gaps.filter((g) => g.severity === "critical").slice(0, 5).map((g) => `Gap: ${g.requirement.slice(0, 80)}`)
  const strengths = explainableFit.strengths.slice(0, 5).map((s) => `Strong: ${s.requirement.slice(0, 80)}`)

  // Update the existing jobs row — only columns that exist on public.jobs
  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      role_title: title,
      company_name: company,
      status: "analyzed",
      score: explainableFit.score,
      fit: fitBandToLegacy[explainableFit.band],
      score_gaps: gaps,
      score_strengths: strengths,
      seniority_level: seniority,
      role_family: analysis.role_family,
      industry_guess: analysis.industry_guess,
      job_description: pageContent.slice(0, 10000),
    })
    .eq("id", jobId)
    .eq("user_id", userId)

  if (updateError) {
    console.error("[re-analyze] jobs PATCH error:", updateError.message, updateError.details)
    return { success: false, error: `Failed to update job: ${updateError.message}` }
  }

  // Insert fresh analysis record
  const analysisPayload = {
    user_id: userId,
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
    soc_major_group: analysis.soc_major_group ?? null,
    soc_group_name: analysis.soc_group_name ?? null,
    soc_category: analysis.soc_category ?? null,
    analysis_version: "3.0-explainable",
    analysis_model: "claude-sonnet",
  }
  const analysisUpdate = await supabase
    .from("job_analyses")
    .update(analysisPayload)
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .select("id")
  const analysisWrite = analysisUpdate.error || (analysisUpdate.data?.length ?? 0) > 0
    ? analysisUpdate
    : await supabase.from("job_analyses").insert(analysisPayload).select("id")
  if (analysisWrite.error) {
    console.error("Analysis write error:", analysisWrite.error)
    return { success: false, error: `Failed to save analysis: ${analysisWrite.error.message}` }
  }

  // Insert fresh scores record
  const scoresPayload = {
    job_id: jobId,
    overall_score: Math.round(explainableFit.score),
    confidence_score: explainableFit.confidence === "high" ? 0.9 : explainableFit.confidence === "medium" ? 0.7 : 0.5,
    skills_match: Math.round(dimensionScores.skills),
    experience_relevance: Math.round(dimensionScores.experience),
    evidence_quality: Math.round(dimensionScores.evidence),
    seniority_alignment: Math.round(dimensionScores.seniority),
    ats_keywords: Math.round(dimensionScores.ats),
    scoring_version: "3.0-explainable",
  }
  const scoresUpdate = await supabase
    .from("job_scores")
    .update(scoresPayload)
    .eq("job_id", jobId)
    .select("id")
  const scoresWrite = scoresUpdate.error || (scoresUpdate.data?.length ?? 0) > 0
    ? scoresUpdate
    : await supabase.from("job_scores").insert(scoresPayload).select("id")
  if (scoresWrite.error) {
    console.error("Scores write error:", scoresWrite.error)
    return { success: false, error: `Failed to save scores: ${scoresWrite.error.message}` }
  }

  // Run orchestration (coaching, matching, etc.)
  await runJobFlow({
    supabase,
    userId,
    jobId,
  })

  const { data: updatedJob } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single()

  return { success: true, job: updatedJob }
}
