import { createClient } from "@/lib/supabase/server"
import { streamText, convertToModelMessages } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"
import { COACH_SYSTEM_PROMPT } from "@/lib/ai/prompts/coach"

export const maxDuration = 60

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
    const { messages, jobContext, gapContext } = body
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
      messages: await convertToModelMessages(messages ?? []),
    })
    return result.toTextStreamResponse()
  } catch (error) {
    const errObj = aiProviderError({ code: "COACH_API_ERROR", message: error instanceof Error ? error.message : "Coach error", correlationId })
    logErr(errObj, { route: "/api/coach" })
    return new Response(JSON.stringify(toApiErrorResponse(errObj)), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
