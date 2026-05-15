import { createClient } from "@/lib/supabase/server"
import { streamText } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"
import { COACH_SYSTEM_PROMPT } from "@/lib/ai/prompts/coach"
import { buildCoachContext } from "@/lib/coach/context/build-context"
import { detectCoachSignals } from "@/lib/coach/signals/engine"
import { createCoachMemory } from "@/lib/coach/context/memory"
import { generateRecommendations } from "@/lib/coach/recommendations"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { emitCoachSignals } from "@/lib/coach/signals/emit-signals"

export const maxDuration = 60

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /you\s+are\s+now\s+(a\s+)?(?!career|job|hiring)/i,
  /new\s+instructions?:/i,
  /system\s*prompt:/i,
  /<\/?system>/i,
  /\[INST\]|\[\/INST\]/i,
  /###\s*(system|instruction)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(?!a\s+(career|job|hiring|recruiter))/i,
]

const MAX_MESSAGE_LENGTH = 4000
const MAX_MESSAGES = 50
const FIT_ACTIVATION_THRESHOLD = 70

function sanitizeInput(text: string): { safe: boolean; reason?: string } {
  if (!text || typeof text !== "string") return { safe: false, reason: "invalid_input" }
  if (text.length > MAX_MESSAGE_LENGTH) return { safe: false, reason: "too_long" }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) return { safe: false, reason: "injection_attempt" }
  }
  return { safe: true }
}

export async function POST(request: Request) {
  const { authError, aiProviderError, unknownError } = await import("@/lib/errors/factory")
  const { logError: logErr } = await import("@/lib/errors/logger")
  const { toApiErrorResponse } = await import("@/lib/errors/response")
  const { createCorrelationId } = await import("@/lib/errors/correlation")
  const correlationId = createCorrelationId()
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErrorObj } = await supabase.auth.getUser()
    if (authErrorObj || !user) {
      const err = authError({ code: "NOT_AUTHENTICATED", correlationId })
      logErr(err, { route: "/api/coach" })
      return new Response(JSON.stringify(toApiErrorResponse(err)), { status: 401, headers: { "Content-Type": "application/json" } })
    }

    const body = await request.json()
    // AI SDK v6 DefaultChatTransport sends: { id, messages, message, trigger, messageId, ...extraBody }
    // jobContext and gapContext arrive as merged extraBody fields.
    const { messages, jobContext, gapContext } = body
    const jobId = typeof jobContext?.jobId === "string" ? jobContext.jobId : null

    // Validate message array
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return new Response("Invalid request", { status: 400 })
    }

    // Helper: extract plain text from a v6 UIMessage.
    function extractText(msg: { role: string; parts?: { type: string; text?: string }[]; content?: unknown }): string {
      if (Array.isArray(msg.parts)) {
        return msg.parts.filter(p => p.type === "text").map(p => p.text ?? "").join(" ")
      }
      return typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content ?? "")
    }

    // Sanitize all user messages for injection attempts.
    for (const msg of messages) {
      if (msg.role === "user") {
        const check = sanitizeInput(extractText(msg))
        if (!check.safe) {
          return new Response(
            JSON.stringify({ error: "Message rejected", reason: check.reason }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }
      }
    }

    // Convert v6 UIMessage[] (parts-based) → CoreMessage[] (content-based) for streamText.
    const coreMessages = messages
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; parts?: { type: string; text?: string }[]; content?: unknown }) => ({
        role: m.role as "user" | "assistant",
        content: extractText(m),
      }))

    // ── Parallel data fetch ───────────────────────────────────────────────────
    const [profileResult, recentJobsResult, activeJobResult] = await Promise.all([
      supabase
        .from("user_profile")
        .select("full_name, summary, skills, location")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("jobs")
        .select("id, role_title, company_name, status, score, applied_at, generated_resume, generated_cover_letter, quality_passed, evidence_map")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(10),
      jobId
        ? supabase
            .from("jobs")
            .select("id, role_title, company_name, status, score, applied_at, generated_resume, generated_cover_letter, quality_passed, evidence_map, voice_drift_result")
            .eq("id", jobId)
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ])

    const profile = profileResult.data
    const recentJobs = Array.isArray(recentJobsResult.data) ? recentJobsResult.data : []
    const activeJob = activeJobResult.data

    // ── Build coaching context ────────────────────────────────────────────────
    const fitScore = activeJob?.score ?? jobContext?.score ?? 0

    let workflowStage = "job_ingested"
    let blockers: string[] = []

    if (activeJob) {
      const readiness = evaluateReadiness(activeJob)
      workflowStage = readiness.stage
      blockers = readiness.blockedReasons
    }

    const applicationHistory = recentJobs
      .filter(j => j.applied_at)
      .map(j => ({ title: j.role_title, company: j.company_name, date: j.applied_at }))

    const generationHistory = recentJobs
      .filter(j => j.generated_resume || j.generated_cover_letter)
      .map(j => ({ jobId: j.id, title: j.role_title }))

    const evidenceMap = activeJob?.evidence_map
    const mappedCount = typeof evidenceMap === "object" && evidenceMap !== null
      ? Object.keys(evidenceMap).filter(k =>
          !["matching_complete", "completed_at", "bullet_provenance", "paragraph_provenance",
            "selected_evidence_ids", "blocked_evidence"].includes(k)
        ).length
      : 0

    const coachContext = buildCoachContext({
      workflowStage,
      blockers,
      readiness: activeJob ? (evaluateReadiness(activeJob).isReady ? 1 : 0) : 0,
      evidenceCoverage: mappedCount,
      fitScore,
      generationHistory,
      applicationHistory,
      currentPage: jobId ? "job_detail" : gapContext ? "gap_clarification" : "dashboard",
      currentAction: blockers[0] ?? "",
    })

    const signals = detectCoachSignals(coachContext, createCoachMemory())
    void emitCoachSignals(supabase, signals, user.id, jobId)
    const recommendations = generateRecommendations(coachContext, signals)

    // ── Assemble system prompt ────────────────────────────────────────────────
    let systemPrompt = COACH_SYSTEM_PROMPT

    // Profile
    if (profile) {
      systemPrompt += `\n\n## User Profile\n- Name: ${profile.full_name || "Not provided"}\n- Location: ${profile.location || "Not provided"}\n- Skills: ${Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || "Not provided"}\n- Summary: ${profile.summary || "Not provided"}`
    }

    // Active job context
    if (jobContext) {
      systemPrompt += `\n\n## Current Job Context\n- Title: ${jobContext.title}\n- Company: ${jobContext.company}${jobContext.score != null ? `\n- Fit Score: ${jobContext.score}%` : ""}${jobContext.status ? `\n- Status: ${jobContext.status}` : ""}`
    }

    // Gap clarification context
    if (gapContext) {
      systemPrompt += `\n\n## Gap Clarification Mode\nHelp the user address this specific gap:\n- Job: ${gapContext.jobTitle} at ${gapContext.company}${gapContext.gap ? `\n- Gap: ${gapContext.gap.requirement}\n- Category: ${gapContext.gap.category}\n- Question: ${gapContext.gap.coach_question}` : ""}`
    }

    // Workflow state
    if (workflowStage !== "job_ingested" || blockers.length > 0) {
      systemPrompt += `\n\n## Pipeline State\n- Stage: ${workflowStage}`
      if (blockers.length > 0) {
        systemPrompt += `\n- Blockers: ${blockers.join("; ")}`
      }
      if (applicationHistory.length > 0) {
        systemPrompt += `\n- Applications submitted: ${applicationHistory.length}`
      }
    }

    // Coaching intelligence from recommendations
    if (recommendations.length > 0) {
      const top = recommendations.slice(0, 3)
      systemPrompt += `\n\n## Coaching Intelligence\n` +
        top.map(r => `- [${(r.type ?? "insight").toUpperCase()}] ${r.message}`).join("\n")
    }

    // Rejection pattern analysis — coach feedback loop
    const rejectedJobs = recentJobs.filter(j => j.status === "rejected")
    if (rejectedJobs.length > 0) {
      const scoredRejections = rejectedJobs.filter(j => j.score != null)
      const avgRejectionScore = scoredRejections.length > 0
        ? Math.round(scoredRejections.reduce((sum, j) => sum + (j.score ?? 0), 0) / scoredRejections.length)
        : null

      const withMaterials = rejectedJobs.filter(j => j.generated_resume || j.generated_cover_letter).length
      const withoutMaterials = rejectedJobs.length - withMaterials

      systemPrompt += `\n\n## Rejection History (${rejectedJobs.length} rejection${rejectedJobs.length !== 1 ? "s" : ""})`
      if (avgRejectionScore !== null) {
        systemPrompt += `\n- Average fit score at rejection: ${avgRejectionScore}%`
        if (avgRejectionScore < FIT_ACTIVATION_THRESHOLD) {
          systemPrompt += ` — below the ${FIT_ACTIVATION_THRESHOLD}% threshold. Suggest the user improve evidence or target better-fit roles.`
        }
      }
      if (withoutMaterials > 0) {
        systemPrompt += `\n- ${withoutMaterials} rejection${withoutMaterials !== 1 ? "s" : ""} occurred without generated materials — user may have applied too early.`
      }
      systemPrompt += `\nUse this history proactively: surface patterns, identify whether the user is applying below fit threshold or skipping quality review, and suggest concrete changes.`
    }

    // 70% fit threshold behavior gate
    if (fitScore > 0 && fitScore < FIT_ACTIVATION_THRESHOLD) {
      systemPrompt += `\n\n## Fit Threshold: Gap Mode (${fitScore}% < ${FIT_ACTIVATION_THRESHOLD}%)\nThis job's fit score is below the ${FIT_ACTIVATION_THRESHOLD}% threshold. Prioritize gap identification and evidence coaching over readiness or document polish. Ask the user what experience they have that could address the key gaps.`
    } else if (fitScore >= FIT_ACTIVATION_THRESHOLD) {
      systemPrompt += `\n\n## Fit Threshold: Readiness Mode (${fitScore}% ≥ ${FIT_ACTIVATION_THRESHOLD}%)\nThis job has strong fit. Focus coaching on completing the application package, quality review, and apply readiness rather than gap analysis.`
    }

    const result = streamText({
      model: CLAUDE_MODELS.SONNET,
      system: systemPrompt,
      messages: coreMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const errObj = aiProviderError({ code: "COACH_API_ERROR", message: error instanceof Error ? error.message : "Coach error", correlationId })
    logErr(errObj, { route: "/api/coach" })
    return new Response(JSON.stringify(toApiErrorResponse(errObj)), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
