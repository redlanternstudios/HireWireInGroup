/**
 * lib/coach/rate-limiter.ts
 *
 * Rate limiting for coach tool calls.
 *
 * Limits:
 * - 3 tools per conversation turn
 * - 20 tools per conversation (N-turn span)
 * - 100 tools per day per user
 * - Per-tool limits (e.g. max 5 evidence creations/day)
 *
 * Stores in Supabase to persist across requests.
 */

import { createClient } from "@/lib/supabase/server"
import type { CoachToolName } from "./tools"

export interface RateLimitConfig {
  per_turn: number
  per_conversation: number
  per_day: number
  per_tool: Record<CoachToolName, { per_day?: number; per_hour?: number }>
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  per_turn: 3,
  per_conversation: 20,
  per_day: 100,
  per_tool: {
    createEvidence: { per_day: 10 },
    updateEvidence: { per_day: 50 },
    deleteEvidence: { per_hour: 2, per_day: 5 },
    mapEvidenceToRequirement: { per_day: 50 },
    unmapEvidence: { per_day: 30 },
    markRequirementAddressed: { per_day: 30 },
    deriveCompositeEvidence: { per_day: 10 },
    recordOutcome: { per_day: 20 },
    archiveJob: { per_day: 10 },
    markSessionComplete: { per_day: 50 },
  },
}

export interface RateLimitCheckResult {
  allowed: boolean
  reason?: string
  retryAfter?: number
  usage?: {
    current: number
    limit: number
  }
}

/**
 * Check if a tool call is allowed under rate limits.
 * Returns { allowed: true } if OK, or { allowed: false, reason: "..." } if blocked.
 */
export async function checkToolRateLimit(
  userId: string,
  sessionId: string,
  toolName: CoachToolName,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS,
  conversationTurnNumber?: number
): Promise<RateLimitCheckResult> {
  const supabase = await createClient()
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // 1. Per-day global limit
  const { count: dayCount } = await supabase
    .from("coach_tool_calls")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", dayAgo.toISOString())

  if ((dayCount ?? 0) >= config.per_day) {
    return {
      allowed: false,
      reason: `Daily limit reached (${config.per_day}/day)`,
      usage: { current: dayCount ?? 0, limit: config.per_day },
    }
  }

  // 2. Per-turn limit
  if (conversationTurnNumber != null) {
    const { count: turnCount } = await supabase
      .from("coach_tool_calls")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("conversation_turn", conversationTurnNumber)

    if ((turnCount ?? 0) >= config.per_turn) {
      return {
        allowed: false,
        reason: `Tool limit reached for this response (${config.per_turn}/turn)`,
        usage: { current: turnCount ?? 0, limit: config.per_turn },
      }
    }
  }

  // 3. Per-conversation limit
  const { count: conversationCount } = await supabase
    .from("coach_tool_calls")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("session_id", sessionId)

  if ((conversationCount ?? 0) >= config.per_conversation) {
    return {
      allowed: false,
      reason: `Conversation tool limit reached (${config.per_conversation}/conversation)`,
      usage: { current: conversationCount ?? 0, limit: config.per_conversation },
    }
  }

  // 4. Per-tool limits
  const toolConfig = config.per_tool[toolName]
  if (toolConfig) {
    // Per-day tool limit
    if (toolConfig.per_day !== undefined) {
      const { count: toolDayCount } = await supabase
        .from("coach_tool_calls")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tool_name", toolName)
        .gte("created_at", dayAgo.toISOString())

      if ((toolDayCount ?? 0) >= toolConfig.per_day) {
        return {
          allowed: false,
          reason: `${toolName} limit reached (${toolConfig.per_day}/day)`,
          usage: { current: toolDayCount ?? 0, limit: toolConfig.per_day },
        }
      }
    }

    // Per-hour tool limit
    if (toolConfig.per_hour !== undefined) {
      const { count: toolHourCount } = await supabase
        .from("coach_tool_calls")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tool_name", toolName)
        .gte("created_at", hourAgo.toISOString())

      if ((toolHourCount ?? 0) >= toolConfig.per_hour) {
        return {
          allowed: false,
          reason: `${toolName} rate limit (${toolConfig.per_hour}/hour)`,
          retryAfter: 3600,
          usage: { current: toolHourCount ?? 0, limit: toolConfig.per_hour },
        }
      }
    }
  }

  return { allowed: true }
}

/**
 * Log a tool call (whether successful or not).
 * Used for rate limiting and audit trails.
 */
export async function logToolCall(
  userId: string,
  sessionId: string,
  toolName: CoachToolName,
  args: Record<string, unknown>,
  result: { success: boolean; error?: string },
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase.from("coach_tool_calls").insert({
      user_id: userId,
      session_id: sessionId,
      tool_name: toolName,
      conversation_turn: typeof metadata?.conversation_turn === "number" ? metadata.conversation_turn : null,
      arguments: args,
      success: result.success,
      error_message: result.error || null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Don't throw on logging failure
    console.error("[HireWire] Failed to log tool call:", err)
  }
}
