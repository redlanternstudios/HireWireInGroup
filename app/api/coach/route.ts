import { createClient } from "@/lib/supabase/server"
import { streamText, convertToModelMessages } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"
import { COACH_SYSTEM_PROMPT } from "@/lib/ai/prompts/coach"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

export const maxDuration = 60

// Patterns that indicate prompt injection attempts
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
      return new Response(JSON.stringify(toApiErrorResponse(err)), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const body = await request.json()
    // AI SDK v6 DefaultChatTransport sends: { id, messages, message, trigger, messageId, ...extraBody }
    // jobContext and gapContext arrive as merged extraBody fields.
    const { messages, jobContext, gapContext } = body
<<<<<<< HEAD
=======

    // Validate message array
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return new Response("Invalid request", { status: 400 })
    }

    // Helper: extract plain text from a v6 UIMessage.
    // v6 messages have parts[{ type, text }] instead of a content string.
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
    // We only keep user and assistant turns — strip tool/data parts.
    const coreMessages = messages
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; parts?: { type: string; text?: string }[]; content?: unknown }) => ({
        role: m.role as "user" | "assistant",
        content: extractText(m),
      }))

    // Build system prompt with optional context
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    let systemPrompt = COACH_SYSTEM_PROMPT
    if (jobContext) {
      systemPrompt += `\n\n## Current Job Context\nThe user is working on this specific role:\n- Title: ${jobContext.title}\n- Company: ${jobContext.company}${jobContext.score != null ? `\n- Fit Score: ${jobContext.score}%` : ""}${jobContext.status ? `\n- Status: ${jobContext.status}` : ""}`
    }
    if (gapContext) {
      systemPrompt += `\n\n## Gap Clarification Mode\nHelp the user address this specific gap:\n- Job: ${gapContext.jobTitle} at ${gapContext.company}${gapContext.gap ? `\n- Gap: ${gapContext.gap.requirement}\n- Category: ${gapContext.gap.category}\n- Question: ${gapContext.gap.coach_question}` : ""}`
    }
    const { data: profile } = await supabase
      .from("user_profile")
      .select("full_name, summary, skills, location")
      .eq("user_id", user.id)
      .single()
    if (profile) {
      systemPrompt += `\n\n## User Profile\n- Name: ${profile.full_name || "Not provided"}\n- Location: ${profile.location || "Not provided"}\n- Skills: ${Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || "Not provided"}\n- Summary: ${profile.summary || "Not provided"}`
    }
    const result = streamText({
      model: CLAUDE_MODELS.HAIKU,
      system: systemPrompt,
<<<<<<< HEAD
      messages: await convertToModelMessages(messages ?? []),
    })
    return result.toTextStreamResponse()
=======
      messages: coreMessages,
    })

    return result.toUIMessageStreamResponse()
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
  } catch (error) {
    const errObj = aiProviderError({ code: "COACH_API_ERROR", message: error instanceof Error ? error.message : "Coach error", correlationId })
    logErr(errObj, { route: "/api/coach" })
    return new Response(JSON.stringify(toApiErrorResponse(errObj)), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
