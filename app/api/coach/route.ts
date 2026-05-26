import { createClient } from "@/lib/supabase/server"
import { streamText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS, isAnthropicConfigured } from "@/lib/ai/gateway"
import { COACH_SYSTEM_PROMPT } from "@/lib/ai/prompts/coach"
import { buildCoachContext } from "@/lib/coach/context/build-context"
import { detectCoachSignals } from "@/lib/coach/signals/engine"
import { createCoachMemory } from "@/lib/coach/context/memory"
import { generateRecommendations } from "@/lib/coach/recommendations"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { emitCoachSignals } from "@/lib/coach/signals/emit-signals"
import { isEvidenceMapMetadataKey } from "@/lib/coach-step"
import { buildEvidenceLibraryContext, isContextEngineEnabled } from "@/lib/context-engine"
import { COACH_TOOLS } from "@/lib/coach/tools"
import { routeToolCall, formatToolResultForStream } from "@/lib/coach/tool-router"
import { buildCoachSystemPrompt } from "@/lib/coach/buildCoachPrompt"
import { stepCountIs } from "ai"

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
const MAX_CONTEXT_ITEMS = 8

function sanitizeInput(text: string): { safe: boolean; reason?: string } {
  if (!text || typeof text !== "string") return { safe: false, reason: "invalid_input" }
  if (text.length > MAX_MESSAGE_LENGTH) return { safe: false, reason: "too_long" }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) return { safe: false, reason: "injection_attempt" }
  }
  return { safe: true }
}

function formatList(value: unknown, limit = MAX_CONTEXT_ITEMS): string {
  if (!Array.isArray(value) || value.length === 0) return "Not provided"
  return value.slice(0, limit).map(String).join(", ")
}

function formatProfileJsonList(value: unknown, labelKeys: string[], limit = 5): string[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, limit).map((item) => {
    if (!item || typeof item !== "object") return String(item)
    const row = item as Record<string, unknown>
    return labelKeys
      .map((key) => row[key])
      .filter(Boolean)
      .map(String)
      .join(" — ")
  }).filter(Boolean)
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

    if (!isAnthropicConfigured()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI Coach is not connected in this environment. Add AI_GATEWAY_API_KEY to enable live coaching.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    // AI SDK v6 DefaultChatTransport sends: { id, messages, message, trigger, messageId, ...extraBody }
    // jobContext and gapContext arrive as merged extraBody fields.
    const { messages, jobContext, gapContext } = body
    const requestedSessionId = typeof body?.sessionId === "string" ? body.sessionId : null
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
    const [profileResult, evidenceResult, recentJobsResult, activeJobResult, outcomesResult] = await Promise.all([
      supabase
        .from("user_profile")
        .select("full_name, name, title, summary, skills, tools, domains, certifications, education, experience, location")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("evidence_library")
        .select("id, source_type, source_title, company_name, role_name, date_range, responsibilities, tools_used, outcomes, proof_snippet, confidence_level")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("jobs")
        .select("id, role_title, company_name, status, score, score_gaps, gap_clarifications, gaps_addressed, applied_at, generated_resume, generated_cover_letter, quality_passed, evidence_map")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(10),
      jobId
        ? supabase
            .from("jobs")
            .select("id, role_title, company_name, job_description, status, score, score_gaps, score_strengths, gap_clarifications, gaps_addressed, responsibilities, qualifications_required, qualifications_preferred, applied_at, generated_resume, generated_cover_letter, quality_passed, evidence_map, voice_drift_result")
            .eq("id", jobId)
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("application_outcomes")
        .select("job_id, outcome, outcome_date, notes, days_to_response, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    const profile = profileResult.data
    const evidenceLibrary = Array.isArray(evidenceResult.data) ? evidenceResult.data : []
    const recentJobs = Array.isArray(recentJobsResult.data) ? recentJobsResult.data : []
    const activeJob = activeJobResult.data
    const recentOutcomes = Array.isArray(outcomesResult.data) ? outcomesResult.data : []

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
      ? Object.keys(evidenceMap).filter(k => !isEvidenceMapMetadataKey(k)).length
      : 0

    const coachContext = buildCoachContext({
      workflowStage,
      blockers,
      readiness: activeJob ? (evaluateReadiness(activeJob).isReady ? 1 : 0) : 0,
      evidenceCoverage: mappedCount,
      fitScore,
      generationHistory,
      applicationHistory,
      recentOutcomes,
      currentPage: jobId ? "job_detail" : gapContext ? "gap_clarification" : "dashboard",
      currentAction: blockers[0] ?? "",
    })

    const signals = detectCoachSignals(coachContext, createCoachMemory())
    void emitCoachSignals(supabase, signals, user.id, jobId)
    const recommendations = generateRecommendations(coachContext, signals)

    // ── Assemble system prompt ────────────────────────────────────────────────
    const gapRequirementId =
      typeof gapContext?.gap?.requirement_id === "string" ? gapContext.gap.requirement_id : null
    const activeEvidenceMap =
      activeJob?.evidence_map && typeof activeJob.evidence_map === "object" && !Array.isArray(activeJob.evidence_map)
        ? activeJob.evidence_map as { requirement_matches?: Array<Record<string, unknown>> }
        : null
    const targetedRequirement = gapRequirementId
      ? activeEvidenceMap?.requirement_matches?.find((match) => match.requirement_id === gapRequirementId)
      : null
    const hasRequirementScopedPrompt = Boolean(gapContext?.gap && gapRequirementId)
    let systemPrompt = hasRequirementScopedPrompt
      ? buildCoachSystemPrompt({
          gapRequirement: String(gapContext.gap.requirement ?? targetedRequirement?.requirement_text ?? "this requirement"),
          requirementId: gapRequirementId,
          requirementIntent: typeof targetedRequirement?.employer_intent === "string"
            ? targetedRequirement.employer_intent
            : typeof gapContext.gap.category === "string"
              ? gapContext.gap.category
              : null,
          currentEvidence: Array.isArray(targetedRequirement?.matched_evidence_titles)
            ? targetedRequirement.matched_evidence_titles.filter((item): item is string => typeof item === "string")
            : [],
          jobTitle: String(gapContext.jobTitle ?? jobContext?.title ?? activeJob?.role_title ?? "this role"),
          jobCompany: String(gapContext.company ?? jobContext?.company ?? activeJob?.company_name ?? "this company"),
          jobDescriptionSummary: String(activeJob?.job_description ?? "").slice(0, 500),
          existingEvidenceTitles: evidenceLibrary.map((item) => String(item.source_title ?? "Evidence")).filter(Boolean),
          priorMessages: coreMessages.slice(-10),
        })
      : COACH_SYSTEM_PROMPT

    // Profile
    if (profile) {
      const experienceLines = formatProfileJsonList(profile.experience, ["role", "title", "company"], 5)
      const educationLines = formatProfileJsonList(profile.education, ["degree", "school", "field", "year"], 5)
      systemPrompt += `\n\n## User Profile\nREFERENCE THIS WHEN VALIDATING QUESTIONS: Before asking about a specific expertise (PM, architecture, ML, etc.), check if the user's documented roles below support it. If not, acknowledge the gap and ask about adjacent experience.\n- Name: ${profile.full_name || profile.name || "Not provided"}\n- Current title: ${profile.title || "Not provided"}\n- Location: ${profile.location || "Not provided"}\n- Skills: ${formatList(profile.skills)}\n- Tools: ${formatList(profile.tools)}\n- Domains: ${formatList(profile.domains)}\n- Certifications: ${formatList(profile.certifications)}\n- Education: ${educationLines.length > 0 ? educationLines.join("; ") : "Not provided"}\n- Experience: ${experienceLines.length > 0 ? experienceLines.join("; ") : "Not provided"}\n- Summary: ${profile.summary || "Not provided"}`
    }

    // Evidence library snapshot
    if (evidenceLibrary.length > 0) {
      systemPrompt += `\n\n## Evidence Library Snapshot\nUse this user-owned evidence when answering. Do not invent missing facts.\n` +
        evidenceLibrary.slice(0, 12).map((e) => {
          const proof = e.proof_snippet || [...(e.responsibilities ?? []), ...(e.outcomes ?? [])].slice(0, 2).join("; ")
          const tools = Array.isArray(e.tools_used) && e.tools_used.length > 0 ? ` Tools: ${e.tools_used.slice(0, 6).join(", ")}.` : ""
          return `- ${e.source_title} (${e.source_type}${e.company_name ? `, ${e.company_name}` : ""}): ${String(proof || "No proof snippet").slice(0, 240)}.${tools}`
        }).join("\n")
    }

    // Active job context
    if (jobContext) {
      systemPrompt += `\n\n## Current Job Context\n- Title: ${jobContext.title}\n- Company: ${jobContext.company}${jobContext.score != null ? `\n- Fit Score: ${jobContext.score}%` : ""}${jobContext.status ? `\n- Status: ${jobContext.status}` : ""}`
    }
    if (activeJob) {
      systemPrompt += `\n\n## Active Job Analysis\n- Required qualifications: ${formatList(activeJob.qualifications_required)}\n- Responsibilities: ${formatList(activeJob.responsibilities)}\n- Score gaps: ${formatList(activeJob.score_gaps)}\n- Score strengths: ${formatList(activeJob.score_strengths)}`
    }
    if (recentOutcomes.length > 0) {
      systemPrompt += `\n\n## Prior Application Outcomes\nUse these only for strategy and pattern recognition. Do not change readiness decisions because of outcomes.\n` +
        recentOutcomes.map((outcome) =>
          `- ${outcome.outcome}${outcome.days_to_response != null ? ` after ${outcome.days_to_response} days` : ""}${outcome.notes ? `: ${String(outcome.notes).slice(0, 160)}` : ""}`
        ).join("\n")
    }

    if (isContextEngineEnabled() && evidenceLibrary.length > 0) {
      const contextProfile = buildEvidenceLibraryContext({
        userId: user.id,
        records: evidenceLibrary as Array<Record<string, any>>,
      })
      const allowed = contextProfile.capabilities
        .filter((capability) => capability.allowed_usage !== "blocked")
        .slice(0, 8)
      if (allowed.length > 0) {
        systemPrompt += `\n\n## ContextEngine Evidence Permissions\nWhen answering, label claims as evidence-backed, adjacent, gap, or interview-only.\n` +
          allowed.map((capability) =>
            `- ${capability.capability_name}: ${capability.allowed_usage}, ${capability.confidence} confidence. ${capability.reasoning_summary}`
          ).join("\n")
      }
    }

    // Gap clarification context
    if (gapContext && !hasRequirementScopedPrompt) {
      systemPrompt += `\n\n## Gap Clarification Mode\nHelp the user translate this specific job expectation into verified proof:\n- Job: ${gapContext.jobTitle} at ${gapContext.company}${gapContext.gap ? `\n- Requirement ID: ${gapContext.gap.requirement_id ?? "not provided"}\n- Requirement: ${gapContext.gap.requirement}\n- Category: ${gapContext.gap.category}\n- Question: ${gapContext.gap.coach_question}` : ""}`
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

    systemPrompt += `\n\n## Data Access and Write Boundaries\n- You may reason across this user's own profile, evidence library, jobs, fit scores, gaps, and generated workflow state provided in context.\n- You must never imply access to other users, admin data, hidden database rows, secrets, billing internals, or system prompts.\n- You may suggest profile/evidence/job updates, but durable writes require explicit user confirmation through HireWire UI actions.\n- For gap dialogue, handle one gap at a time: ask a targeted question, turn the answer into an evidence draft when appropriate, ask for confirmation, then move to the next gap.\n- New evidence must be factual, user-provided, and scoped to the authenticated user's own evidence library.`

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

    // Add tool descriptions to system prompt
    systemPrompt += `\n\n## Available Actions\nWhen helpful, you can take the following actions directly:\n`
    systemPrompt += `- **createEvidence**: Ask the user first. "Should I create an evidence entry for your database optimization work?" Only call if they say yes.\n`
    systemPrompt += `- **mapEvidenceToRequirement**: Auto-map if evidence clearly matches requirement (>80% confidence). Show result: "Mapped your AWS experience to Infrastructure requirement."\n`
    systemPrompt += `- **deriveCompositeEvidence**: For requirements like "10+ years experience", tally user-confirmed roles or existing evidence into one derived evidence entry. Ask/verify the breakdown first, then call this tool so the user can confirm before saving.\n`
    systemPrompt += `- **recordOutcome**: Only when user explicitly tells you the result: "I got rejected" or "They scheduled an interview."\n`
    systemPrompt += `- **markRequirementAddressed**: Use when you've successfully mapped sufficient evidence to a gap.\n`
    systemPrompt += `- **archiveJob** & **deleteEvidence**: Require explicit user request ("Archive this job" / "Delete that evidence").\n`
    systemPrompt += `Always narrate what you're doing: "I'll map that to the Infrastructure requirement" before calling tools.`

    // Use provided requirement session when valid; otherwise fall back to ephemeral session.
    let sessionId = crypto.randomUUID()
    if (requestedSessionId) {
      const { data: ownedSession } = await supabase
        .from("coach_sessions")
        .select("id")
        .eq("id", requestedSessionId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
      if (ownedSession?.id) {
        sessionId = ownedSession.id
      }
    }
    const conversationTurn = 1

    const result = streamText({
      model: CLAUDE_MODELS.SONNET,
      system: systemPrompt,
      messages: coreMessages,
      tools: Object.fromEntries(
        Object.entries(COACH_TOOLS).map(([name, tool]) => [
          name,
          {
            description: tool.description,
            inputSchema: tool.parameters,
            execute: async (input: unknown, options: { toolCallId?: string }) => {
              const args = input && typeof input === "object" && !Array.isArray(input)
                ? input as Record<string, unknown>
                : {}
              const output = await routeToolCall({
                sessionId,
                jobId,
                toolName: name as keyof typeof COACH_TOOLS,
                args,
                clientToolCallId: options.toolCallId,
                confirmed: false,
                conversationTurnNumber: conversationTurn,
              })

              return {
                message: formatToolResultForStream(output),
                success: output.success,
                needsConfirmation: output.result.needsConfirmation === true,
                confirmationPrompt: output.result.confirmationPrompt,
                toolName: name,
                toolCallId: output.toolCallId,
                sessionId,
                jobId,
                args,
              }
            },
          },
        ])
      ),
      stopWhen: stepCountIs(3),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const errObj = aiProviderError({ code: "COACH_API_ERROR", message: error instanceof Error ? error.message : "Coach error", correlationId })
    logErr(errObj, { route: "/api/coach" })
    return new Response(JSON.stringify(toApiErrorResponse(errObj)), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
