/**
 * POST /api/coach/chat
 * General-purpose streaming coach endpoint.
 * Powers the floating CoachBubble on all dashboard pages.
 * Uses COACH_SYSTEM_PROMPT — not job/gap-scoped.
 */
import { streamText } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"
import { COACH_SYSTEM_PROMPT } from "@/lib/ai/prompts"
import { checkSafety } from "@/lib/safety"

export const maxDuration = 30

type UIMessagePart = { type: string; text?: string }
type UIMessage = { role: "user" | "assistant" | "system"; parts?: UIMessagePart[]; content?: string }

function extractText(m: UIMessage): string {
  if (m.parts) return m.parts.filter(p => p.type === "text").map(p => p.text ?? "").join("")
  return m.content ?? ""
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const rawMessages: UIMessage[] = body.messages ?? []

    if (!rawMessages.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    // Normalise to { role, content } for safety check
    const normalised = rawMessages.map(m => ({ role: m.role, content: extractText(m) }))

    const safetyResult = checkSafety(normalised, { userId: user.id })
    if (!safetyResult.allowed) {
      return NextResponse.json({ error: safetyResult.blockedResponse }, { status: 400 })
    }

    const result = streamText({
      model: CLAUDE_MODELS.SONNET,
      system: COACH_SYSTEM_PROMPT,
      messages: normalised
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[coach/chat] Error:", error)
    return NextResponse.json({ error: "Coach unavailable. Please try again." }, { status: 500 })
  }
}
