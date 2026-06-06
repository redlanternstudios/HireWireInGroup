/**
 * lib/coach/tool-idempotence.ts
 *
 * Idempotence handling for tool calls.
 *
 * Tool calls are identified by (userId, sessionId, toolCallId, toolName).
 * If the same call is retried, return cached result instead of re-executing.
 *
 * This prevents duplicate mutations if the network times out or the user
 * accidentally clicks the button twice.
 */

import { createClient } from "@/lib/supabase/server"
import type { ToolCallResult } from "./tools"

export interface ToolCallCache {
  tool_call_id: string
  user_id: string
  session_id: string
  tool_name: string
  result: ToolCallResult
  created_at: string
  expires_at: string
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a deterministic tool call ID from context.
 * Used to deduplicate retries.
 */
export function generateToolCallId(
  userId: string,
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>
): string {
  const key = `${userId}:${sessionId}:${toolName}:${JSON.stringify(args)}`
  // In production, use a proper hash function
  return Buffer.from(key).toString("base64").slice(0, 32)
}

/**
 * Check if a tool call was already executed.
 * Returns cached result if found and not expired.
 */
export async function getCachedToolResult(
  userId: string,
  sessionId: string,
  toolCallId: string,
  toolName: string
): Promise<ToolCallResult | null> {
  const supabase = await createClient()

  try {
    const { data } = await supabase
      .from("coach_tool_call_cache")
      .select("result, expires_at")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("tool_call_id", toolCallId)
      .eq("tool_name", toolName)
      .single()

    if (!data) return null

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return null
    }

    return data.result as ToolCallResult
  } catch (err) {
    // Not found or other error
    return null
  }
}

/**
 * Cache a tool call result.
 * Future calls with the same ID will return this cached result.
 */
export async function cacheToolResult(
  userId: string,
  sessionId: string,
  toolCallId: string,
  toolName: string,
  result: ToolCallResult
): Promise<void> {
  const supabase = await createClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS)

  try {
    await supabase.from("coach_tool_call_cache").insert({
      user_id: userId,
      session_id: sessionId,
      tool_call_id: toolCallId,
      tool_name: toolName,
      result,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
  } catch (err) {
    // Non-critical; don't block
    console.error("[HireWire] Failed to cache tool result:", err)
  }
}

/**
 * Invalidate cached results for a session.
 * Call this when the session ends or context significantly changes.
 */
export async function invalidateSessionCache(userId: string, sessionId: string): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase
      .from("coach_tool_call_cache")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId)
  } catch (err) {
    console.error("[HireWire] Failed to invalidate session cache:", err)
  }
}

/**
 * Clean up expired cache entries.
 * Run periodically (e.g., as a cron job) to prevent cache bloat.
 */
export async function cleanupExpiredCache(): Promise<number> {
  const supabase = await createClient()

  try {
    const { count } = await supabase
      .from("coach_tool_call_cache")
      .delete()
      .lt("expires_at", new Date().toISOString())

    return count ?? 0
  } catch (err) {
    console.error("[HireWire] Failed to cleanup cache:", err)
    return 0
  }
}
