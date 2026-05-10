import { createClient } from "@/lib/supabase/server"
import { streamText } from "ai"
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
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { messages, jobContext, gapContext } = body

    // Validate message array
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return new Response("Invalid request", { status: 400 })
    }

    // Sanitize all user messages for injection attempts
    for (const msg of messages) {
      if (msg.role === "user") {
        const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
        const check = sanitizeInput(content)
        if (!check.safe) {
          return new Response(
            JSON.stringify({ error: "Message rejected", reason: check.reason }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }
      }
    }

    // Build system prompt with optional context
    let systemPrompt = COACH_SYSTEM_PROMPT

    if (jobContext) {
      systemPrompt += `\n\n## Current Job Context\nThe user is working on this specific role:\n- Title: ${jobContext.title}\n- Company: ${jobContext.company}${jobContext.score != null ? `\n- Fit Score: ${jobContext.score}%` : ""}${jobContext.status ? `\n- Status: ${jobContext.status}` : ""}`
    }

    if (gapContext) {
      systemPrompt += `\n\n## Gap Clarification Mode\nHelp the user address this specific gap:\n- Job: ${gapContext.jobTitle} at ${gapContext.company}${gapContext.gap ? `\n- Gap: ${gapContext.gap.requirement}\n- Category: ${gapContext.gap.category}\n- Question: ${gapContext.gap.coach_question}` : ""}`
    }

    // Fetch user profile for context
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
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[api/coach] error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
