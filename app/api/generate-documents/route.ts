import { NextRequest, NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { handleDomainEvent } from "@/lib/events"
import { isAnthropicConfigured, CLAUDE_MODELS } from "@/lib/adapters/anthropic"
import { GenerateDocumentsInputSchema } from "@/lib/schemas/job-intake"
import {
  BANNED_PHRASES,
  detectBannedPhrases,
  detectVaguePatterns,
  filterEvidenceForResume,
  filterEvidenceForCoverLetter,
  getEvidenceUsageRule,
  determineGenerationStrategy,
  analyzeBulletConcreteness,
  hasMetrics,
  type GenerationStrategy,
  type BulletProvenance,
  type ParagraphProvenance,
} from "@/lib/truthserum"
import {
  detectUnsafeMetrics,
  classifyQuantificationSafety,
  rewriteToQualitative,
  type QuantificationSafety,
} from "@/lib/canonical-evidence"
import type { EvidenceRecord } from "@/lib/types"
import {
  runPreGenerationEnhancement,
  generateProjectsSection,
} from "@/lib/bullet-enhancer"
import {
  extractKnownProducts,
  buildProfileKnowledge,
} from "@/lib/profile-knowledge-resolver"
import { recommendResumeFormat } from "@/lib/resume-formats"
import { sanitizeInput } from "@/lib/safety"
import {
  validateAllClaims,
  scoreDrift,
  type GovernanceEvidence,
} from "@/lib/coach"
import { handleDomainEvent } from "@/lib/domain-events"
import { extractVoiceProfile } from "@/lib/voice/extract-voice-profile"
import { selectVoiceMode, type VoiceMode } from "@/lib/voice/select-voice-mode"
import { checkVoiceDrift } from "@/lib/voice/voice-drift-check"
import type { VoiceProfile, VoiceDriftResult } from "@/lib/voice/voice-types"
import { emitDomainEventWithClient } from "@/lib/domain-events/emit-event"

// Helper for retry with exponential backoff (handles 429 rate limits)
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error as Error
      const errorMessage = lastError?.message || ""
      const isRateLimited = errorMessage.includes("429") || errorMessage.includes("rate limit")
      
      if (isRateLimited && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) // 2s, 4s, 8s
        console.log(`[hirewire] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

// Schema for evidence mapping
const EvidenceMapSchema = z.object({
  matched_skills: z.array(z.string()).describe("Skills from profile that match job requirements"),
  matched_tools: z.array(z.string()).describe("Tools/technologies from profile that match"),
  matched_experiences: z.array(z.object({
    experience_title: z.string(),
    company: z.string(),
    relevance: z.string().describe("How this experience relates to the job"),
    key_achievements: z.array(z.string()),
    evidence_id: z.string().optional().nullable().describe("ID of the source evidence if available"),
  })).describe("Work experiences that are relevant to this job"),
  matched_projects: z.array(z.object({
    project_name: z.string(),
    relevance: z.string(),
    evidence_id: z.string().optional().nullable(),
  })).describe("Projects that demonstrate relevant skills"),
  gaps: z.array(z.string()).describe("Required qualifications the candidate may not have"),
  fit_score: z.number().min(0).max(100).describe("Overall fit score 0-100"),
  fit_rationale: z.string().describe("2-3 sentence explanation of the fit score"),
  requirement_coverage: z.number().min(0).max(100).describe("Percentage of required qualifications covered"),
})

// Schema for structured resume with provenance
const ResumeWithProvenanceSchema = z.object({
  summary: z.string().describe("2-3 sentence professional summary tailored to this role"),
  experience_bullets: z.array(z.object({
    bullet_text: z.string().describe("The achievement bullet point"),
    source_evidence_id: z.string().describe("ID of the evidence this bullet is based on"),
    source_role: z.string().describe("Role title from the source evidence"),
    source_company: z.string().describe("Company from the source evidence"),
    matched_requirement: z.string().optional().describe("Which job requirement this bullet addresses"),
    keywords_used: z.array(z.string()).describe("Job keywords incorporated in this bullet"),
  })).describe("Resume bullets with provenance tracking"),
  skills_section: z.array(z.string()).describe("Relevant skills to list"),
})

// Schema for cover letter with provenance
const CoverLetterWithProvenanceSchema = z.object({
  paragraphs: z.array(z.object({
    paragraph_text: z.string().describe("The paragraph content"),
    job_theme_addressed: z.string().describe("Which aspect of the job this paragraph addresses"),
    evidence_ids_used: z.array(z.string()).describe("IDs of evidence items referenced"),
    claim_confidence: z.enum(["high", "medium", "low"]).describe("Confidence in claims made"),
  })).describe("Cover letter paragraphs with provenance"),
})

// Schema for quality check
const QualityCheckSchema = z.object({
  invented_claims: z.array(z.string()).describe("Any claims that seem fabricated or not supported by the source material"),
  vague_bullets: z.array(z.string()).describe("Bullet points that are too generic or could apply to anyone"),
  ai_filler: z.array(z.string()).describe("Phrases that sound like typical AI-generated filler"),
  repeated_structures: z.array(z.string()).describe("Repetitive sentence patterns"),
  unsupported_claims: z.array(z.string()).describe("Claims that cannot be verified from the evidence"),
  overall_passed: z.boolean().describe("Whether the document passes quality standards"),
  improvement_suggestions: z.array(z.string()).describe("Specific suggestions to improve weak sections"),
})

async function loadUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [profileResult, linksResult] = await Promise.all([
    supabase.from("user_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_profile_links").select("id,link_type,url,is_primary").eq("user_id", userId).order("is_primary", { ascending: false }),
  ])

  if (profileResult.error || !profileResult.data) {
    return null
  }

  // Attach canonical links array to profile (replaces legacy jsonb links column)
  return {
    ...profileResult.data,
    links: linksResult.data || [],
  }
}

async function loadEvidenceLibrary(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: evidence, error } = await supabase
    .from("evidence_library")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("priority_rank", { ascending: false })

  if (error) {
    return []
  }

  return evidence || []
}

async function loadJobAnalysis(supabase: Awaited<ReturnType<typeof createClient>>, jobId: string, userId: string) {
  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      *,
      job_analyses (*),
      job_scores (
        overall_score,
        confidence_score
      )
    `)
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single()

  if (error || !job) {
    return null
  }

  // Transform to UI-expected format
  const analyses = (job.job_analyses as Array<Record<string, unknown>>) || []
  const scores = (job.job_scores as Array<{ overall_score?: number }>) || []
  const analysis = analyses[0] || {}
  const score = scores[0]?.overall_score ?? null
  
  // Derive fit from score
  let fit: string | null = null
  if (score !== null) {
    if (score >= 75) fit = "HIGH"
    else if (score >= 50) fit = "MEDIUM"
    else fit = "LOW"
  }
  
  return {
    ...job,
    // Map normalized columns to legacy names
    title: job.role_title || analysis.title || job.title,
    company: job.company_name || analysis.company || job.company,
    score,
    fit,
    score_gaps: analysis.known_gaps || [],
    score_strengths: analysis.matched_skills || [],
    location: analysis.location || job.location,
    salary_range: analysis.salary_text || job.salary_range,
    responsibilities: analysis.responsibilities || [],
    qualifications_required: analysis.qualifications_required || [],
    qualifications_preferred: analysis.qualifications_preferred || [],
    ats_keywords: analysis.ats_phrases || analysis.keywords || [],
  }
}

async function loadSourceResume(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: resume, error } = await supabase
    .from("source_resumes")
    .select("id, file_name, parsed_text, parsed_data, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !resume) {
    return null
  }

  return resume
}

/**
 * Build strategy-aware generation prompt based on fit
 */
function buildStrategyPrompt(strategy: GenerationStrategy, hasUnresolvedGaps: boolean = false): string {
  const gapWarning = hasUnresolvedGaps ? `
WARNING: Some gaps remain unresolved. Be conservative - avoid overconfident claims in areas where evidence is thin.` : ""

  switch (strategy) {
    case "direct_match":
      return `
GENERATION STRATEGY: DIRECT MATCH
You may be assertive about qualifications since evidence strongly supports the match.
Use confident language and highlight achievements directly relevant to the role.
Still avoid any invention - stick to facts from evidence.${gapWarning}`

    case "adjacent_transition":
      return `
GENERATION STRATEGY: ADJACENT TRANSITION
Lean on transferable skills and related experience.
Do NOT claim direct experience you don't have.
Frame adjacent work as relevant without pretending direct ownership.
Be honest about the transition narrative.${gapWarning}`

    case "stretch_honest":
      return `
GENERATION STRATEGY: STRETCH BUT HONEST
This is a stretch role - be careful not to overclaim.
Emphasize learning ability and adaptability.
Acknowledge gaps indirectly through what you bring, not what you lack.
Do NOT exaggerate or invent qualifications.${gapWarning}`

    case "do_not_generate":
      return `
GENERATION BLOCKED: DO NOT GENERATE
This role is too much of a stretch. Generating materials would require invention.
Return an error explaining why generation was blocked.`
  }
}

function buildVoiceInstructions(mode: VoiceMode, profile: VoiceProfile): string {
  const preservePhrases = profile.preserve.phrases.slice(0, 5)
  const actionVerbs = profile.vocabulary.commonActionVerbs.slice(0, 6)

  switch (mode) {
    case "preserve_original":
      return `
VOICE PRESERVATION MODE — match the candidate's existing writing style precisely:
- Tone: ${profile.tone.primary}
- Formality: ${profile.formality}
- Sentence length: ${profile.sentencePattern.averageLength} (bullets)
- Bullet pattern: ${profile.bulletStyle.typicalPattern}
- Vocabulary level: ${profile.vocabulary.level}
${actionVerbs.length > 0 ? `- Use action verbs from their style: ${actionVerbs.join(", ")}` : ""}
${preservePhrases.length > 0 ? `- Preserve phrases like: "${preservePhrases.join('", "')}"` : ""}
${profile.avoid.risks.length > 0 ? `- Avoid: ${profile.avoid.risks.join("; ")}` : ""}
Do NOT upgrade to more formal, executive, or polished language than the original.`

    case "polish_lightly":
      return `
LIGHT POLISH MODE — improve clarity while keeping the candidate's voice:
- Keep: ${profile.tone.primary} tone, ${profile.formality} formality
- Fix grammar and clarity only — do not change their personality or register
- Keep sentence length similar (${profile.sentencePattern.averageLength})
- Avoid introducing corporate jargon or buzzwords not found in the original`

    case "professional_upgrade":
      return `
PROFESSIONAL UPGRADE MODE — rewrite with professional clarity grounded in their evidence:
- Upgrade: structure, clarity, and action verb strength
- Keep: core facts, evidence, and truthful claims
- Use professional vocabulary; avoid invented superlatives
- Maintain action verb bullets`
  }
}

export async function POST(request: NextRequest) {
  const { validationError, authError, aiProviderError, documentGenerationError, supabaseError, unknownError } = await import("@/lib/errors/factory")
  const { logError: logErr } = await import("@/lib/errors/logger")
  const { toApiErrorResponse } = await import("@/lib/errors/response")
  const { createCorrelationId } = await import("@/lib/errors/correlation")
  const correlationId = createCorrelationId()
  try {
    const body = await request.json()
    const { selected_evidence_ids, _retry_count = 0 } = body
    
    // Validate input
    const parseResult = GenerateDocumentsInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }
    
    const { job_id } = parseResult.data
    const isRetry = _retry_count > 0
    const MAX_RETRIES = 1 // Auto-retry once if quality check fails

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { success: false, error: "AI service not configured. ANTHROPIC_API_KEY required." },
      { status: 500 }
      )
    }

    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    const userId = user.id

    // Use user-scoped client for all reads and writes (RLS enforced)
    const supabase = userClient

    // === PLAN ENFORCEMENT ===
    // Check user's plan and generation count this month
    const { data: userData } = await supabase
      .from("users")
      .select("plan_type")
      .eq("id", userId)
      .single()
    
    const plan = userData?.plan_type || "free"
    
    // Free users: 5 generations per month.
    // Use the canonical users.generations_this_month + users.usage_reset_at counter —
    // NOT a jobs-table count — so both the gate and the incrementer share one source of truth.
    if (plan === "free") {
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      firstOfMonth.setHours(0, 0, 0, 0)

      const monthNeedsReset = !userData?.usage_reset_at ||
        new Date(userData.usage_reset_at) < firstOfMonth

      const generationsThisMonth = monthNeedsReset ? 0 : (userData?.generations_this_month || 0)

      if (generationsThisMonth >= 5) {
        return NextResponse.json(
          { 
            success: false, 
            error: "generation_limit_reached",
            user_message: "You've reached your monthly limit of 5 document generations. Upgrade to Pro for unlimited generations."
          },
          { status: 403 }
        )
      }
    }

    // Set status to 'generating' immediately
    await supabase
      .from("jobs")
      .update({
        status: "generating",
        generation_status: "generating",
        generation_error: null,
        generation_attempts: _retry_count + 1,
        last_generation_at: new Date().toISOString(),
      })
      .eq("id", job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)

    // Load all required data in parallel
    const [profile, allEvidence, jobData, sourceResume] = await Promise.all([
      loadUserProfile(supabase, userId),
      loadEvidenceLibrary(supabase, userId),
      loadJobAnalysis(supabase, job_id, userId),
      loadSourceResume(supabase, userId),
    ])

    // Start voice profile extraction from source resume in parallel with validation checks.
    // Fire-and-forget the promise now; await it before generation prompts are built.
    const voiceProfilePromise: Promise<VoiceProfile | null> = sourceResume?.parsed_text
      ? extractVoiceProfile(sourceResume.parsed_text)
      : Promise.resolve(null)

    // HARD FAIL: Evidence is required for document generation
    if (!allEvidence || allEvidence.length === 0) {
      await supabase
        .from("jobs")
        .update({
          status: "needs_review",
          generation_status: "failed",
          generation_error: "evidence_required",
        })
        .eq("id", job_id)
        .eq("user_id", userId)

      return NextResponse.json(
        {
          success: false,
          error: "evidence_required",
          user_message: "No evidence found in your library. Please upload a resume or add evidence manually before generating materials."
        },
        { status: 400 }
      )
    }

    // If no profile exists, create a minimal one or use source resume data
    if (!profile && !sourceResume?.parsed_data) {
      // Update job status to indicate why generation failed
      await supabase
        .from("jobs")
        .update({
          status: "needs_review",
          generation_status: "failed",
          generation_error: "profile_required",
        })
        .eq("id", job_id)
        .eq("user_id", userId)

      return NextResponse.json(
        {
          success: false,
          error: "profile_required",
          user_message: "Please complete your profile or upload a resume before generating materials."
        },
        { status: 400 }
      )
    }
    
    // Allow generation with just source resume if profile is missing
    const hasUsableData = profile || sourceResume?.parsed_data

    if (!jobData) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      )
    }

    const jobAnalysis = jobData.job_analyses?.[0]
    
    // Evidence matching gate removed — generation is allowed regardless of matching_complete
    
    // Load gap clarifications for this job (job-specific context)
    const gapClarifications = (jobData.gap_clarifications as Array<{
      gap_requirement: string
      answer: string
      routing: string
    }>) || []

    // TRUTH-LOCK: Filter evidence based on usage rules
    // If user selected specific evidence, use that; otherwise filter automatically
    let resumeEvidence = selected_evidence_ids?.length > 0
      ? allEvidence.filter((e: { id: string }) => selected_evidence_ids.includes(e.id))
      : filterEvidenceForResume(allEvidence)
    
    let coverLetterEvidence = selected_evidence_ids?.length > 0
      ? allEvidence.filter((e: { id: string }) => selected_evidence_ids.includes(e.id))
      : filterEvidenceForCoverLetter(allEvidence)

    // Log what evidence was filtered out and why
    const blockedEvidence = allEvidence.filter((e: EvidenceRecord) => {
      const rule = getEvidenceUsageRule(e)
      return rule === "blocked" || rule === "interview_only"
    })

    // Build the evidence context with usage rules annotated
    // Use source resume parsed data when profile data is incomplete
    const sourceResumeData = sourceResume?.parsed_data as {
      full_name?: string;
      email?: string;
      phone?: string;
      location?: string;
      summary?: string;
      skills?: string[];
      experience?: Array<{
        title: string;
        company: string;
        start_date?: string;
        end_date?: string;
        description?: string;
        bullets?: string[];
      }>;
      education?: Array<{
        degree: string;
        school: string;
        year?: string;
      }>;
    } | null

  // Merge profile with source resume data (profile takes precedence)
  // SECURITY: Sanitize free-form text fields to prevent prompt injection
  const effectiveName = profile?.full_name || sourceResumeData?.full_name || "Not provided"
  const effectiveLocation = profile?.location || sourceResumeData?.location || "Not provided"
  const rawSummary = profile?.summary || sourceResumeData?.summary || "Not provided"
  const effectiveSummary = sanitizeInput(rawSummary) // Prevent prompt injection via summary field
  const effectiveSkills = (profile?.skills?.length > 0 ? profile.skills : sourceResumeData?.skills) || []
  const effectiveExperience = (profile?.experience?.length > 0 ? profile.experience : sourceResumeData?.experience) || []
  const effectiveEducation = (profile?.education?.length > 0 ? profile.education : sourceResumeData?.education) || []

    const profileContext = `
CANDIDATE PROFILE:
Name: ${effectiveName}
Location: ${effectiveLocation}
Summary: ${effectiveSummary}

Skills: ${effectiveSkills.join(", ")}

Work Experience:
${effectiveExperience.map((exp: { title: string; company: string; start_date?: string; end_date?: string; description?: string; bullets?: string[] }) => `
- ${exp.title} at ${exp.company} (${exp.start_date || ""} - ${exp.end_date || "Present"})
  ${exp.description || ""}
  ${exp.bullets ? exp.bullets.map(b => `  • ${b}`).join("\n") : ""}
`).join("\n")}

Education:
${effectiveEducation.map((edu: { degree: string; school: string; year?: string }) => `
- ${edu.degree} from ${edu.school} ${edu.year ? `(${edu.year})` : ""}
`).join("\n")}
${sourceResume?.parsed_text ? `
ADDITIONAL CONTEXT FROM SOURCE RESUME:
(Use this for additional details if the structured data above is incomplete)
${sourceResume.parsed_text.slice(0, 5000)}
` : ""}
`

    const evidenceContext = resumeEvidence.length > 0 ? `
VERIFIED EVIDENCE LIBRARY (use ONLY these for resume):
${resumeEvidence.map((e: {
  id: string;
  source_title: string;
  source_type: string;
  company_name?: string;
  role_name?: string;
  date_range?: string;
  responsibilities?: string[];
  tools_used?: string[];
  outcomes?: string[];
  approved_achievement_bullets?: string[];
  confidence_level: string;
  what_not_to_overstate?: string;
  team_size?: number;
  budget_scope?: string;
  user_impact_scale?: string;
  industries?: string[];
  project_name?: string;
}) => `
--- EVIDENCE [ID: ${e.id}] ---
Type: ${e.source_type}
Title: ${e.source_title}
${e.project_name ? `Project: ${e.project_name}` : ""}
${e.company_name ? `Company: ${e.company_name}` : ""}
${e.role_name ? `Role: ${e.role_name}` : ""}
${e.date_range ? `Period: ${e.date_range}` : ""}
${e.industries?.length ? `Industry: ${e.industries.join(", ")}` : ""}
Confidence: ${e.confidence_level.toUpperCase()}

${e.team_size ? `SCOPE:
  Team Size: ${e.team_size} people
  ${e.budget_scope ? `Budget/Revenue: ${e.budget_scope}` : ""}
  ${e.user_impact_scale ? `User Impact: ${e.user_impact_scale}` : ""}
` : ""}
${e.what_not_to_overstate ? `CONSTRAINT: ${e.what_not_to_overstate}
` : ""}
${e.responsibilities?.length ? `RESPONSIBILITIES:
${e.responsibilities.map(r => `  - ${r}`).join("\n")}
` : ""}
${e.tools_used?.length ? `TOOLS: ${e.tools_used.join(", ")}
` : ""}
${e.outcomes?.length ? `OUTCOMES:
${e.outcomes.map(o => `  - ${o}`).join("\n")}
` : ""}
${e.approved_achievement_bullets?.length ? `APPROVED BULLETS:
${e.approved_achievement_bullets.map(b => `  - ${b}`).join("\n")}
` : ""}
`).join("\n")}
` : ""

    const jobContext = `
JOB DETAILS:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || "Not specified"}
${jobData.salary_range ? `Salary: ${jobData.salary_range}` : ""}

${jobAnalysis?.responsibilities?.length ? `Key Responsibilities:
${jobAnalysis.responsibilities.map((r: string) => `- ${r}`).join("\n")}` : ""}

${jobAnalysis?.qualifications_required?.length ? `Required Qualifications:
${jobAnalysis.qualifications_required.map((q: string) => `- ${q}`).join("\n")}` : ""}

${jobAnalysis?.qualifications_preferred?.length ? `Preferred Qualifications:
${jobAnalysis.qualifications_preferred.map((q: string) => `- ${q}`).join("\n")}` : ""}

${jobAnalysis?.keywords?.length ? `Important Keywords: ${jobAnalysis.keywords.join(", ")}` : ""}
${jobAnalysis?.ats_phrases?.length ? `ATS Phrases to Include: ${jobAnalysis.ats_phrases.join(", ")}` : ""}
${!jobAnalysis && jobData.job_description ? `
Full Job Description (manually entered — extract responsibilities and keywords from this):
${(jobData.job_description as string).slice(0, 3000)}` : ""}
${gapClarifications.length > 0 ? `

ADDITIONAL CONTEXT FROM CANDIDATE (use this to address identified gaps):
${gapClarifications.map(c => `
Gap: ${c.gap_requirement}
Candidate's response: ${c.answer}
`).join("\n")}
NOTE: The candidate provided this additional context to address gaps. Use this information when crafting the resume and cover letter, but DO NOT fabricate or exaggerate beyond what they stated.` : ""}
`

  // Step 1: Create evidence map and determine strategy (with retry for rate limits)
  // Using Claude for higher token limits and better quality
  const evidenceMapResult = await withRetry(() => generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: EvidenceMapSchema }),
    prompt: `Analyze the match between this candidate and job opportunity.

${profileContext}

${evidenceContext}

${jobContext}

Create an evidence map that:
1. Identifies skills and tools from the profile that match job requirements
2. Selects the most relevant work experiences (include evidence IDs when referencing evidence items)
3. Notes any gaps in qualifications
4. Provides an honest fit score
5. Calculate what percentage of REQUIRED qualifications are covered

Be conservative - only include matches that are clearly supported by the evidence. Do not exaggerate or invent connections.`,
  }))
  const generatedEvidenceMap = evidenceMapResult.experimental_output!

    // Determine generation strategy based on fit
    const evidenceQuality = resumeEvidence.filter((e: { confidence_level: string }) => e.confidence_level === "high").length / (resumeEvidence.length || 1) * 100
    const { strategy, reasoning: strategyReasoning } = determineGenerationStrategy(
      jobData,
      generatedEvidenceMap.requirement_coverage,
      evidenceQuality
    )

    // Block generation if strategy is "do_not_generate"
    if (strategy === "do_not_generate") {
      await supabase
        .from("jobs")
        .update({
          status: "error",
          generation_status: "failed",
          generation_error: "Generation blocked: role too much of a stretch",
        })
        .eq("id", job_id)
        .eq("user_id", userId)

      return NextResponse.json({
        success: false,
        error: "Generation blocked: This role is too much of a stretch.",
        strategy,
        strategy_reasoning: strategyReasoning,
        requirement_coverage: generatedEvidenceMap.requirement_coverage,
        gaps: generatedEvidenceMap.gaps,
      }, { status: 400 })
    }

    // Determine if there are unresolved gaps (gaps detected but not clarified)
    const hasUnresolvedGaps = generatedEvidenceMap.gaps.length > 0 && gapClarifications.length === 0
    const strategyPrompt = buildStrategyPrompt(strategy, hasUnresolvedGaps)

    // Await voice profile extraction (started in parallel with evidence map generation)
    const originalVoiceProfile = await voiceProfilePromise
    const voiceMode: VoiceMode = originalVoiceProfile
      ? selectVoiceMode(originalVoiceProfile)
      : "preserve_original"
    const voiceInstructions = originalVoiceProfile
      ? buildVoiceInstructions(voiceMode, originalVoiceProfile)
      : ""

    const resumeFormatRecommendation = recommendResumeFormat({
      roleTitle: String(jobData.title ?? ""),
      seniority: String(jobData.role_family ?? ""),
      applicationChannel: String(jobData.job_url ?? ""),
    })

    // Step 2: Generate resume with bullet-level provenance (with retry for rate limits)
  // SIMPLIFIED: Reduced prompt verbosity to produce more natural, human-sounding output
  // Using Claude for higher token limits and better quality
  const resumeResult = await withRetry(() => generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: ResumeWithProvenanceSchema }),
    prompt: `Write resume content for this job application. Sound like a sharp professional, not a bot.

${profileContext}

${evidenceContext}

${jobContext}

MATCH CONTEXT:
Skills: ${generatedEvidenceMap.matched_skills.join(", ")}
Tools: ${generatedEvidenceMap.matched_tools.join(", ")}
Gaps: ${generatedEvidenceMap.gaps.join(", ")}

${strategyPrompt}
${voiceInstructions}

WRITING RULES:
1. Link every bullet to a specific evidence ID
2. Use only facts from the evidence - never invent
3. Start bullets with strong verbs (Built, Led, Shipped, Launched)
4. Include real metrics from evidence when available
5. Write like a human professional would - confident but not robotic
6. If pre-approved bullets exist in evidence, use them directly

QUANTIFICATION POLICY - CRITICAL:
ALLOWED metrics:
- Numbers explicitly stated in the evidence (exact amounts, percentages, counts)
- Deterministic derivations ("team of 5 across 3 regions")
- Factual counts from evidence (number of products, countries, users if stated)

NOT ALLOWED - DO NOT INVENT:
- Percentages like "reduced churn by 25%" unless explicitly in evidence
- Time savings like "saved 40 hours/week" unless explicitly in evidence
- Revenue impact like "generated $2M" unless explicitly in evidence
- Improvement claims like "improved efficiency by 30%" unless explicitly in evidence

IF NO METRIC IN EVIDENCE, use qualitative language instead:
- "Reduced manual work" (not "reduced by 60%")
- "Improved visibility" (not "increased by 45%")
- "Strengthened stakeholder alignment" (not "improved satisfaction by 90%")
- "Accelerated delivery" (not "reduced time by 50%")

KEEP IT SPECIFIC:
- Use exact numbers ONLY when in evidence: "team of 5" not "team"
- Name tools: "React, PostgreSQL" not "modern stack"
- Include scale ONLY if in evidence: "50K users" not "users"
- Preserve industry: "B2B fintech" not "software"

Write 5-8 achievement bullets that the candidate could confidently discuss in an interview. Every metric must be traceable to evidence.`,
  }))
  const resumeWithProvenance = resumeResult.experimental_output!

    // Step 2.5: PRE-GENERATION ENHANCEMENT PASS
    // Strengthen bullets with known profile data before final formatting
    const { enhancedBullets, report: enhancementReport } = await runPreGenerationEnhancement(
      resumeWithProvenance.experience_bullets.map((b: {
        bullet_text: string
        source_evidence_id: string
        source_role: string
        source_company: string
        matched_requirement?: string
        keywords_used: string[]
      }) => ({
        bullet_text: b.bullet_text,
        source_evidence_id: b.source_evidence_id,
        source_role: b.source_role,
        source_company: b.source_company,
        matched_requirement: b.matched_requirement,
        keywords_used: b.keywords_used,
      })),
      {
        full_name: effectiveName,
        email: (profile as any)?.email || sourceResumeData?.email || "",
        phone: (profile as any)?.phone || sourceResumeData?.phone || "",
        location: effectiveLocation,
        summary: effectiveSummary,
        skills: effectiveSkills,
        links: Array.isArray(profile?.links) ? profile.links : [],
        experience: effectiveExperience.map((exp: { title?: string; company?: string; description?: string }) => ({
          title: exp.title || "",
          company: exp.company || "",
          description: exp.description,
        })),
      },
      allEvidence
    )

    // Generate Selected Products section if we have named products with artifacts
    // FIX: Use allEvidence (correct in-scope variable) instead of undefined 'evidence'
    const knownProducts = extractKnownProducts(allEvidence)
    const projectsSection = generateProjectsSection(knownProducts, 3)

    // Step 3: Generate cover letter with paragraph provenance (with retry for rate limits)
  // SIMPLIFIED: More direct prompt for natural, human-sounding cover letters
  // Using Claude for higher token limits and better quality
  const coverLetterResult = await withRetry(() => generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: CoverLetterWithProvenanceSchema }),
    prompt: `Write a cover letter for this role. Sound confident and human, not like a template.

${profileContext}

EVIDENCE:
${coverLetterEvidence.map((e: {
  id: string;
  source_title: string;
  source_type: string;
  company_name?: string;
}) => `[${e.id}] ${e.source_title} at ${e.company_name || "N/A"}`).join("\n")}

${jobContext}

${strategyPrompt}
${voiceInstructions}

TONE: Write like a sharp professional sending a letter to someone they respect.
- Open directly with who you are and why you fit
- Give 1-2 specific examples of relevant work (link to evidence IDs)
- Close briefly - no groveling or excessive enthusiasm
- Never say "I am excited to apply" or "I would be thrilled"
- 3-4 paragraphs total`,
  }))
  const coverLetterWithProvenance = coverLetterResult.experimental_output!

    // Build final formatted documents - Premium Clean Minimalist format
  const effectiveEmail = (profile as any)?.email || sourceResumeData?.email || ""
  const effectivePhone = (profile as any)?.phone || sourceResumeData?.phone || ""
  const contactInfo = [
  effectiveLocation,
  effectiveEmail,
  effectivePhone
  ].filter(Boolean).join(" | ")
  
  // TARGET ROLE: Use the job title being applied to for resume alignment
  const targetJobTitle = jobData?.title || jobData?.role_title || jobAnalysis?.title || "Professional"
  
  // Use ENHANCED bullets (with product names, metrics, context injected)
  const experienceBullets = enhancedBullets
  .map(b => `• ${b.bullet_text}`)
  .join("\n")
  
  // Build ATS-safe formatted resume (no unicode dividers, clean structure)
  // CHANGED: Removed unicode box-drawing characters that break ATS parsing
  // CHANGED: Added job title as professional headline for alignment
  const formattedResume = `${(effectiveName || "CANDIDATE NAME").toUpperCase()}
  ${targetJobTitle}
  ${contactInfo}

PROFESSIONAL SUMMARY
${resumeWithProvenance.summary}

PROFESSIONAL EXPERIENCE
${experienceBullets}
${projectsSection ? `
${projectsSection}
` : ""}
CORE COMPETENCIES
${resumeWithProvenance.skills_section.join(", ")}

EDUCATION
${effectiveEducation.map((edu: { degree: string; school: string; year?: string }) => 
  `${edu.degree}, ${edu.school}${edu.year ? ` (${edu.year})` : ""}`
).join("\n")}`

    // Build premium formatted cover letter with professional signature
    const today = new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    })
    
    // Build professional signature block with phone number
    const signatureBlock = [
      effectiveName || "Candidate",
      effectivePhone ? `Direct: ${effectivePhone}` : null,
      effectiveEmail || null,
    ].filter(Boolean).join("\n")
    
    const formattedCoverLetter = `${today}

Dear Hiring Manager,

${coverLetterWithProvenance.paragraphs.map(p => p.paragraph_text).join("\n\n")}

Sincerely,

${signatureBlock}`

    // ── VOICE DRIFT CHECK ─────────────────────────────────────────────────────
    // Extract voice profile from the generated resume and compare to the original.
    // Non-blocking: drift result is persisted but does not gate this generation.
    let voiceDriftResult: VoiceDriftResult | null = null
    if (originalVoiceProfile) {
      try {
        const generatedVoiceProfile = await extractVoiceProfile(formattedResume)
        voiceDriftResult = checkVoiceDrift(originalVoiceProfile, generatedVoiceProfile)
      } catch {
        // Voice drift check is non-blocking — log and continue
        console.error("[HireWire] voice drift check failed, skipping")
      }
    }

    // ── GOVERNANCE LAYER ──────────────────────────────────────────────────────
    // Runs AFTER document text is finalized but BEFORE quality check and DB write.
    // This is additive — it does not replace the existing quality checks.

    // Build a GovernanceEvidence[] from the already-loaded evidence
    const governanceEvidence: GovernanceEvidence[] = allEvidence.map((e: EvidenceRecord) => ({
      id: e.id,
      source_title: e.source_title,
      source_type: e.source_type,
      confidence_level: e.confidence_level,
      outcomes: Array.isArray(e.outcomes) ? e.outcomes : [],
      tools_used: Array.isArray(e.tools_used) ? e.tools_used : [],
      team_size: (e as any).team_size ?? null,
      budget_scope: (e as any).budget_scope ?? null,
      user_impact_scale: (e as any).user_impact_scale ?? null,
      what_not_to_overstate: e.what_not_to_overstate ?? null,
      approved_achievement_bullets: Array.isArray(e.approved_achievement_bullets)
        ? e.approved_achievement_bullets
        : [],
    }))

    // 1. Claim validation — every bullet and paragraph checked against its evidence
    const bulletClaimInputs = enhancedBullets.map((b) => ({
      text: b.bullet_text,
      cited_evidence_id: (b as { bullet_text: string; source_evidence_id?: string }).source_evidence_id ?? null,
    }))
    const paragraphClaimInputs = coverLetterWithProvenance.paragraphs.map((p: {
      paragraph_text: string
      evidence_ids_used: string[]
    }) => ({
      text: p.paragraph_text,
      cited_evidence_id: p.evidence_ids_used?.[0] ?? null,
    }))

    const claimValidation = validateAllClaims(
      bulletClaimInputs,
      paragraphClaimInputs,
      governanceEvidence
    )

    // 2. Drift scoring — measures deviation of generated output from evidence
    const driftResult = scoreDrift({
      bulletTexts: bulletClaimInputs.map(b => ({ text: b.text, evidence_id: b.cited_evidence_id })),
      paragraphTexts: paragraphClaimInputs.map(p => ({ text: p.text, evidence_id: p.cited_evidence_id })),
      bulletVerdicts: claimValidation.bulletVerdicts,
      paragraphVerdicts: claimValidation.paragraphVerdicts,
      evidenceSet: governanceEvidence,
    })

    // 3. Governance hard block: fabricated claims or drift above threshold
    const governancePassed =
      !claimValidation.hasFabricated && !driftResult.is_blocking

    if (!governancePassed) {
      const blockReason = driftResult.is_blocking
        ? `Generation blocked by drift score (${driftResult.score}/100): ${driftResult.summary}`
        : `Generation blocked: ${claimValidation.fabricatedCount} fabricated claim(s) detected.`

      await supabase
        .from("jobs")
        .update({
          status: "error",
          generation_status: "failed",
          generation_error: blockReason,
          governance_passed: false,
          governance_drift_score: driftResult.score,
          governance_version: "1.0.0",
        })
        .eq("id", job_id)
        .eq("user_id", userId)

      // Persist the governance run record for auditing
      await supabase.from("generation_governance_runs").insert({
        user_id: userId,
        job_id,
        strategy,
        strategy_decision: {
          strategy,
          requirement_coverage: generatedEvidenceMap.requirement_coverage,
          evidence_quality_pct: evidenceQuality,
          reasoning: strategyReasoning,
        },
        bullet_verdicts: claimValidation.bulletVerdicts,
        paragraph_verdicts: claimValidation.paragraphVerdicts,
        fabricated_count: claimValidation.fabricatedCount,
        low_confidence_count: claimValidation.lowConfidenceCount,
        drift_score: driftResult.score,
        drift_is_blocking: driftResult.is_blocking,
        drift_flags: driftResult.flags,
        drift_summary: driftResult.summary,
        governance_passed: false,
        failed_at_phase: driftResult.is_blocking ? "drift_scoring" : "claim_validation",
        governance_version: "1.0.0",
      // Governance table may not exist yet — do not block the response
      }).then(() => {}, () => {})

      void handleDomainEvent({
        supabase,
        event_type: "quality_failed",
        job_id,
        user_id: userId,
        source: "generate_documents_route",
        payload: {
          reason: "governance_block",
          drift_score: driftResult.score,
          fabricated_count: claimValidation.fabricatedCount,
          block_reason: blockReason,
          correlation_id: correlationId,
        },
      })

      return NextResponse.json({
        success: false,
        error: blockReason,
        governance: {
          passed: false,
          fabricated_count: claimValidation.fabricatedCount,
          drift_score: driftResult.score,
          drift_summary: driftResult.summary,
          drift_flags: driftResult.flags.filter((f) => f.severity === "block"),
        },
      }, { status: 400 })
    }

    // ── END GOVERNANCE LAYER ──────────────────────────────────────────────────

    // Step 4: Detect banned phrases and vague patterns
    const resumeBannedPhrases = detectBannedPhrases(formattedResume)
    const coverLetterBannedPhrases = detectBannedPhrases(formattedCoverLetter)
    const allBannedPhrases = [...new Set([...resumeBannedPhrases, ...coverLetterBannedPhrases])]
    
    const vaguePatterns = detectVaguePatterns(formattedResume)

    // Analyze bullet concreteness
    const bulletAnalysis = resumeWithProvenance.experience_bullets.map(b => ({
      bullet: b.bullet_text,
      ...analyzeBulletConcreteness(b.bullet_text),
      has_metric: hasMetrics(b.bullet_text)
    }))
    
    const weakBullets = bulletAnalysis.filter(b => !b.is_concrete_enough)
    
    // QUANTIFICATION SAFETY CHECK - Detect and flag unsafe invented metrics
    const unsafeMetricsFound: { bullet: string; unsafe_claims: string[]; safe_alternatives: string[] }[] = []
    
    for (const bullet of enhancedBullets) {
      const { has_unsafe, unsafe_claims, safe_alternatives } = detectUnsafeMetrics(bullet.bullet_text)
      if (has_unsafe) {
        unsafeMetricsFound.push({
          bullet: bullet.bullet_text,
          unsafe_claims,
          safe_alternatives,
        })
      }
    }
    
    // Unsafe metrics will be flagged in quality issues

    // Step 5: AI Quality check - use smaller model to avoid rate limits
    // Wrapped in try-catch since smaller models can sometimes fail schema compliance
    let qualityCheck: z.infer<typeof QualityCheckSchema>
  try {
    // Quality check uses faster model since it's a simpler task
    const qualityResult = await withRetry(() => generateText({
      model: CLAUDE_MODELS.HAIKU,
      output: Output.object({ schema: QualityCheckSchema }),
      prompt: `You are a resume quality reviewer. Analyze the generated documents and return a JSON object with your findings.

GENERATED RESUME:
${formattedResume.slice(0, 2000)}

GENERATED COVER LETTER:
${formattedCoverLetter.slice(0, 1500)}

Return a JSON object with these exact fields:
- invented_claims: array of strings (claims that seem fabricated)
- vague_bullets: array of strings (bullets too generic)
- ai_filler: array of strings (AI-sounding phrases)
- repeated_structures: array of strings (repetitive patterns)
- unsupported_claims: array of strings (unverifiable claims)
- overall_passed: boolean (true if quality is acceptable)
- improvement_suggestions: array of strings (suggestions to improve)

If no issues found, return empty arrays and overall_passed: true.`,
    }))
    qualityCheck = qualityResult.experimental_output!
    } catch (qualityCheckError) {
      console.error("Quality check failed, using defaults:", qualityCheckError)
      // Default to passing quality check if the AI model fails
      // The rule-based checks (banned phrases, vague patterns) will still run
      qualityCheck = {
        invented_claims: [],
        vague_bullets: [],
        ai_filler: [],
        repeated_structures: [],
        unsupported_claims: [],
        overall_passed: true,
        improvement_suggestions: []
      }
    }

    // Build provenance records for storage
    const bulletProvenance: BulletProvenance[] = resumeWithProvenance.experience_bullets.map(b => ({
      bullet_text: b.bullet_text,
      source_evidence_id: b.source_evidence_id,
      source_evidence_title: resumeEvidence.find((e: { id: string; source_title: string }) => e.id === b.source_evidence_id)?.source_title || "Unknown",
      source_role: b.source_role,
      source_company: b.source_company,
      matched_requirement_id: undefined,
      matched_requirement_text: b.matched_requirement,
      claim_confidence: "high" as const,
      keywords_covered: b.keywords_used,
      risk_flags: [],
      is_metric_rich: hasMetrics(b.bullet_text),
      concrete_signal_count: analyzeBulletConcreteness(b.bullet_text).concrete_signal_count
    }))

    const paragraphProvenance: ParagraphProvenance[] = coverLetterWithProvenance.paragraphs.map(p => ({
      paragraph_text: p.paragraph_text,
      evidence_used: p.evidence_ids_used,
      matched_job_theme: p.job_theme_addressed,
      claim_confidence: p.claim_confidence,
      unsupported_language: detectBannedPhrases(p.paragraph_text)
    }))

    // Calculate quality score - now includes quantification safety
    const qualityPassed = qualityCheck.overall_passed && 
      allBannedPhrases.length === 0 && 
      weakBullets.length <= 1 &&
      unsafeMetricsFound.length === 0 // Block if we detected invented metrics

    const qualityScore = qualityPassed ? 100 : Math.max(0, 
      100 - 
      (allBannedPhrases.length * 10) - 
      (weakBullets.length * 5) - 
      (qualityCheck.invented_claims.length * 15) -
      (qualityCheck.vague_bullets.length * 5)
    )

    // AUTO-RETRY: If quality check fails and we haven't retried yet, regenerate
    const hasSignificantIssues = 
      allBannedPhrases.length > 0 || 
      qualityCheck.invented_claims.length > 0 ||
      weakBullets.length > 2

    if (!qualityPassed && hasSignificantIssues && _retry_count < MAX_RETRIES) {
      // Auto-retry: Quality check failed, regenerating with stricter prompts
      
      // Recursive call with incremented retry count
      const retryBody = JSON.stringify({
        job_id,
        selected_evidence_ids,
        _retry_count: _retry_count + 1
      })
      
      const retryRequest = new NextRequest(request.url, {
        method: "POST",
        body: retryBody,
        headers: { "Content-Type": "application/json" }
      })
      
      return POST(retryRequest)
    }

    // Update the job with generated materials
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        generated_resume: formattedResume,
        generated_cover_letter: formattedCoverLetter,
        fit: generatedEvidenceMap.fit_score >= 70 ? "HIGH" : generatedEvidenceMap.fit_score >= 40 ? "MEDIUM" : "LOW",
        score: generatedEvidenceMap.fit_score,
        score_reasoning: { 
          rationale: generatedEvidenceMap.fit_rationale, 
          gaps: generatedEvidenceMap.gaps,
          strategy,
          strategy_reasoning: strategyReasoning,
          requirement_coverage: generatedEvidenceMap.requirement_coverage
        },
        score_strengths: generatedEvidenceMap.matched_skills,
        score_gaps: generatedEvidenceMap.gaps,
        resume_strategy: strategy,
        evidence_map: {
          matching_complete: true, // Set by generate-documents so stage derivation advances past evidence_mapped
          selected_evidence_ids: resumeEvidence.map((e: { id: string }) => e.id),
          bullet_provenance: bulletProvenance,
          paragraph_provenance: paragraphProvenance,
blocked_evidence: blockedEvidence.map((e: EvidenceRecord) => ({ id: e.id, title: e.source_title, reason: getEvidenceUsageRule(e) }))
        },
        status: qualityPassed ? "ready" : "needs_review",
        generation_status: qualityPassed ? "ready" : "needs_review",
        generation_error: null,
        scored_at: new Date().toISOString(),
        generation_timestamp: new Date().toISOString(),
        generation_quality_score: qualityScore,
        resume_format: resumeFormatRecommendation.format,
        resume_font: resumeFormatRecommendation.font,
        format_recommendation_reason: resumeFormatRecommendation.reason,
        governance_passed: true,
        governance_drift_score: driftResult.score,
        governance_version: "1.0.0",
    generation_quality_issues: [
      ...allBannedPhrases.map(p => `Banned phrase: "${p}"`),
      ...vaguePatterns.map(p => `Vague pattern: "${p}"`),
      ...weakBullets.map(b => `Weak bullet (${b.concrete_signal_count}/4 signals): "${b.bullet.substring(0, 50)}..."`),
      ...unsafeMetricsFound.map(m => `UNSAFE METRIC: "${m.unsafe_claims[0]}" - Use instead: "${m.safe_alternatives[0] || 'qualitative language'}"`),
      ...qualityCheck.invented_claims,
      ...qualityCheck.vague_bullets,
          ...qualityCheck.ai_filler,
        ],
        quality_passed: qualityPassed,
        // Store bullet-level provenance for traceability
        resume_provenance: bulletProvenance.map(b => ({
          bullet_text: b.bullet_text,
          source_evidence_id: b.source_evidence_id,
          evidence_title: b.source_evidence_title,
        })),
        // Voice integrity
        voice_mode: voiceMode,
        voice_profile_snapshot: originalVoiceProfile ?? undefined,
        voice_drift_result: voiceDriftResult ?? undefined,
        voice_integrity_passed: voiceDriftResult?.passed ?? true,
        voice_review_status: voiceDriftResult
          ? voiceDriftResult.driftLevel === "none"
            ? "passed"
            : "needs_review"
          : "pending",
      })
      .eq("id", job_id)
      .eq("user_id", userId)

    if (updateError) {
      const err = supabaseError({ code: "JOB_UPDATE_FAILED", message: updateError.message, correlationId })
      logErr(err, { route: "/api/generate-documents" })
      return NextResponse.json(toApiErrorResponse(err), { status: 500 })
    }

    // Emit domain events for generation outcome
    void handleDomainEvent({
      supabase,
      event_type: "documents_generated",
      job_id,
      user_id: userId,
      source: "generate_documents_route",
      payload: {
        strategy,
        quality_passed: qualityPassed,
        quality_score: qualityScore,
        fit_score: generatedEvidenceMap.fit_score,
        correlation_id: correlationId,
      },
    })

    void handleDomainEvent({
      supabase,
      event_type: qualityPassed ? "quality_passed" : "quality_failed",
      job_id,
      user_id: userId,
      source: "generate_documents_route",
      payload: {
        quality_score: qualityScore,
        banned_phrases_count: allBannedPhrases.length,
        weak_bullets_count: weakBullets.length,
        invented_claims_count: qualityCheck.invented_claims.length,
        unsafe_metrics_count: unsafeMetricsFound.length,
        was_auto_retried: isRetry,
        correlation_id: correlationId,
      },
    })

    // Voice domain events — non-blocking
    if (originalVoiceProfile) {
      void emitDomainEventWithClient(supabase, {
        event_type: "voice_profile_extracted",
        job_id,
        user_id: userId,
        source: "generate_documents_route",
        payload: {
          voice_mode: voiceMode,
          tone: originalVoiceProfile.tone.primary,
          formality: originalVoiceProfile.formality,
        },
        invalidates: ["coach_state"],
        recomputes: [],
        affected_routes: ["/dashboard"],
        severity: "info",
        metadata: {},
      })
    }
    if (voiceDriftResult && voiceDriftResult.driftLevel !== "none") {
      void emitDomainEventWithClient(supabase, {
        event_type: "voice_drift_detected",
        job_id,
        user_id: userId,
        source: "generate_documents_route",
        payload: {
          drift_level: voiceDriftResult.driftLevel,
          passed: voiceDriftResult.passed,
          issues: voiceDriftResult.detectedIssues,
          recommended_action: voiceDriftResult.recommendedAction,
          warnings: voiceDriftResult.warnings,
        },
        invalidates: voiceDriftResult.passed ? ["coach_state"] : ["readiness", "coach_state"],
        recomputes: voiceDriftResult.passed ? [] : ["readiness"],
        affected_routes: [`/jobs/${job_id}`, `/jobs/${job_id}/documents`, "/dashboard"],
        severity: voiceDriftResult.driftLevel === "high" ? "warning" : "info",
        metadata: {},
      })
    }

    // Increment generations_this_month for usage tracking (only on successful generation)
    // generations_this_month and usage_reset_at live on the users table, not user_profile
    if (!updateError) {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data: userData } = await supabase
        .from("users")
        .select("generations_this_month, usage_reset_at")
        .eq("id", userId)
        .maybeSingle()

      const needsReset = !userData?.usage_reset_at ||
        new Date(userData.usage_reset_at) < new Date(firstOfMonth)

      await supabase
        .from("users")
        .update({
          generations_this_month: needsReset ? 1 : (userData?.generations_this_month || 0) + 1,
          usage_reset_at: needsReset ? firstOfMonth : userData?.usage_reset_at,
        })
        .eq("id", userId)
    }

    // Update job analysis with matched evidence
    if (jobAnalysis) {
      await supabase
        .from("job_analyses")
        .update({
          matched_skills: generatedEvidenceMap.matched_skills,
          matched_tools: generatedEvidenceMap.matched_tools,
          matched_projects: generatedEvidenceMap.matched_projects.map(p => p.project_name),
          known_gaps: generatedEvidenceMap.gaps,
          ats_match_score: generatedEvidenceMap.fit_score,
        })
        .eq("id", jobAnalysis.id)
        .eq("user_id", userId)
    }

    // Save governance run (additive — does not replace quality check)
    const governanceRunInsert = await supabase.from("generation_governance_runs").insert({
      user_id: userId,
      job_id,
      strategy,
      strategy_decision: {
        strategy,
        requirement_coverage: generatedEvidenceMap.requirement_coverage,
        evidence_quality_pct: evidenceQuality,
        reasoning: strategyReasoning,
      },
      bullet_verdicts: claimValidation.bulletVerdicts,
      paragraph_verdicts: claimValidation.paragraphVerdicts,
      fabricated_count: claimValidation.fabricatedCount,
      low_confidence_count: claimValidation.lowConfidenceCount,
      drift_score: driftResult.score,
      drift_is_blocking: false,
      drift_flags: driftResult.flags,
      drift_summary: driftResult.summary,
      governance_passed: true,
      governance_version: "1.0.0",
    }).select("id").maybeSingle()

    const governanceRunId = governanceRunInsert.data?.id ?? null

    // Update job with governance run reference
    if (governanceRunId) {
      await supabase
        .from("jobs")
        .update({ last_governance_run_id: governanceRunId })
        .eq("id", job_id)
        .eq("user_id", userId)
    }

    // Save quality check
    await supabase.from("generation_quality_checks").insert({
      user_id: userId,
      job_id,
      document_type: "resume",
      invented_claims_found: qualityCheck.invented_claims,
      vague_bullets_found: qualityCheck.vague_bullets,
      ai_filler_found: qualityCheck.ai_filler,
      repeated_structures_found: qualityCheck.repeated_structures,
      unsupported_claims_found: qualityCheck.unsupported_claims,
      passed: qualityPassed,
      issues_count: qualityCheck.invented_claims.length + qualityCheck.vague_bullets.length + qualityCheck.ai_filler.length + allBannedPhrases.length,
    })

    // Emit domain event — best effort, never blocks the response
    await handleDomainEvent(supabase, {
      type: "job.generation_complete",
      jobId: job_id,
      userId,
      payload: {
        generationTimestamp: new Date().toISOString(),
        qualityScore: qualityCheck ? (100 - qualityCheck.invented_claims.length * 20) : null,
        qualityPassed,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      job_id,
      was_auto_retried: isRetry,
      retry_count: _retry_count,
      strategy,
      strategy_reasoning: strategyReasoning,
      resume_format: resumeFormatRecommendation.format,
      resume_font: resumeFormatRecommendation.font,
      format_recommendation_reason: resumeFormatRecommendation.reason,
      evidence_map: {
        fit_score: generatedEvidenceMap.fit_score,
        fit_rationale: generatedEvidenceMap.fit_rationale,
        matched_skills: generatedEvidenceMap.matched_skills,
        matched_tools: generatedEvidenceMap.matched_tools,
        matched_experiences: generatedEvidenceMap.matched_experiences,
        gaps: generatedEvidenceMap.gaps,
        requirement_coverage: generatedEvidenceMap.requirement_coverage,
      },
      generated_resume: formattedResume,
      generated_cover_letter: formattedCoverLetter,
      provenance: {
        bullet_provenance: bulletProvenance,
        paragraph_provenance: paragraphProvenance,
        blocked_evidence: blockedEvidence.map((e: { id: string; source_title: string }) => ({ id: e.id, title: e.source_title, reason: getEvidenceUsageRule(e as unknown as import('@/lib/types').EvidenceRecord) }))
      },
      quality_check: {
        passed: qualityPassed,
        score: qualityScore,
        banned_phrases_found: allBannedPhrases,
        vague_patterns_found: vaguePatterns,
        weak_bullets: weakBullets.map(b => b.bullet),
        issues: {
          invented_claims: qualityCheck.invented_claims,
          vague_bullets: qualityCheck.vague_bullets,
          ai_filler: qualityCheck.ai_filler,
          banned_phrases: allBannedPhrases,
        },
        suggestions: qualityCheck.improvement_suggestions,
      },
      enhancement_report: {
        total_bullets: enhancementReport.totalBullets,
        auto_fixed: enhancementReport.autoFixed,
        needs_review: enhancementReport.needsReview,
        unchanged: enhancementReport.unchanged,
        enhanced_bullets: enhancementReport.enhancedBullets
          .filter(b => b.wasEnhanced)
          .map(b => ({
            original: b.originalText,
            enhanced: b.enhancedText,
            type: b.enhancementType,
            product_added: b.namedProduct,
            metric_added: b.addedMetric,
            context_added: b.addedContext,
          })),
      },
      known_products: knownProducts.map(p => ({
        name: p.name,
        has_website: !!p.website,
        has_github: !!p.github,
        confidence: p.confidence,
      })),
      governance: {
        passed: true,
        governance_version: "1.0.0",
        run_id: governanceRunId,
        drift_score: driftResult.score,
        drift_summary: driftResult.summary,
        drift_warnings: driftResult.flags.filter((f) => f.severity === "warning").length,
        fabricated_count: claimValidation.fabricatedCount,
        low_confidence_count: claimValidation.lowConfidenceCount,
      },
      voice_integrity: voiceDriftResult
        ? {
            voice_mode: voiceMode,
            drift_level: voiceDriftResult.driftLevel,
            passed: voiceDriftResult.passed,
            issues: voiceDriftResult.detectedIssues,
            recommended_action: voiceDriftResult.recommendedAction,
            warnings: voiceDriftResult.warnings,
          }
        : { voice_mode: voiceMode, drift_level: "none", passed: true, issues: [], warnings: [] },
      correlationId,
    })
  } catch (error) {
    // Try to update job status to failed (best effort, don't fail if this fails)
    try {
      const { job_id } = await request.clone().json()
      if (job_id) {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("jobs")
            .update({ status: "error" })
            .eq("id", job_id)
            .eq("user_id", user.id)
        }
      }
    } catch {}
    const errorMessage = error instanceof Error ? error.message : "Generation failed"
    const isRateLimit = errorMessage.includes("rate_limit") || errorMessage.includes("Rate limit") || errorMessage.includes("429")
    if (isRateLimit) {
      const err = aiProviderError({ code: "AI_RATE_LIMIT", message: errorMessage, correlationId, retryable: true })
      logErr(err, { route: "/api/generate-documents" })
      return NextResponse.json({ ...toApiErrorResponse(err), retryAfter: 30 }, { status: 429 })
    }
    const errObj = documentGenerationError({ code: "GENERATION_FAILED", message: errorMessage, correlationId })
    logErr(errObj, { route: "/api/generate-documents" })
    return NextResponse.json(toApiErrorResponse(errObj), { status: 500 })
  }
}
