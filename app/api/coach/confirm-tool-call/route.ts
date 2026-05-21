/**
 * app/api/coach/confirm-tool-call/route.ts
 *
 * Confirmation endpoint for destructive coach tool calls.
 *
 * Flow:
 * 1. Coach calls deleteEvidence() with confirmed=false → returns { needsConfirmation: true }
 * 2. UI shows confirmation dialog
 * 3. User clicks "Confirm"
 * 4. Client calls this endpoint with { toolCallId, confirmed: true }
 * 5. Server directly executes tool WITHOUT re-streaming
 * 6. Returns result for UI to handle
 *
 * This prevents the LLM from re-generating its response after confirmation.
 */

import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/require-user"
import { routeToolCall } from "@/lib/coach/tool-router"
import { getCachedToolResult } from "@/lib/coach/tool-idempotence"
import { COACH_TOOLS, type CoachToolName } from "@/lib/coach/tools"

export async function POST(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const body = await request.json()

    const { toolCallId, sessionId, toolName, jobId, args } = body

    if (!toolCallId || !sessionId || !toolName || !args) {
      return NextResponse.json(
        { error: "Missing required fields: toolCallId, sessionId, toolName, args" },
        { status: 400 }
      )
    }
    if (typeof toolName !== "string" || !(toolName in COACH_TOOLS)) {
      return NextResponse.json({ error: "Unknown tool" }, { status: 400 })
    }
    const safeToolName = toolName as CoachToolName

    // Check if result already cached (e.g., from original attempt)
    const cached = await getCachedToolResult(auth.userId, sessionId, toolCallId, safeToolName)
    if (cached) {
      return NextResponse.json({
        success: cached.success,
        result: cached,
        fromCache: true,
      })
    }

    // Execute the tool with confirmation flag
    const output = await routeToolCall({
      sessionId,
      jobId,
      toolName: safeToolName,
      args,
      clientToolCallId: toolCallId,
      confirmed: true,
      conversationTurnNumber: 0,
    })

    return NextResponse.json({
      success: output.success,
      result: output.result,
      toolCallId: output.toolCallId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirmation failed" },
      { status: 500 }
    )
  }
}
