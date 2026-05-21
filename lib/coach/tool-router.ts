/**
 * lib/coach/tool-router.ts
 *
 * Routes tool calls from the LLM to the correct execution function.
 *
 * Responsibilities:
 * - Dispatch by tool name
 * - Check rate limits before execution
 * - Check idempotence cache
 * - Execute tool with user context
 * - Log results
 * - Return formatted result
 *
 * Every tool call flows through here to ensure:
 * 1. User auth is validated
 * 2. Rate limits are enforced
 * 3. Idempotence is maintained
 * 4. Audit trail is captured
 * 5. Domain events are emitted
 */

import { requireUser } from "@/lib/supabase/require-user"
import type { CoachToolName, ToolCallResult, ToolExecutionContext } from "./tools"
import { COACH_TOOLS } from "./tools"
import * as toolExecution from "./tool-execution"
import {
  checkToolRateLimit,
  logToolCall,
  DEFAULT_RATE_LIMITS,
} from "./rate-limiter"
import {
  generateToolCallId,
  getCachedToolResult,
  cacheToolResult,
} from "./tool-idempotence"

interface ToolRouterInput {
  sessionId: string
  jobId?: string
  toolName: CoachToolName
  args: Record<string, unknown>
  clientToolCallId?: string // Optional ID from client for deduplication
  confirmed?: boolean // For confirmation flow
  conversationTurnNumber?: number
}

interface ToolRouterOutput {
  success: boolean
  toolName: CoachToolName
  toolCallId: string
  result: ToolCallResult
  rateLimitStatus: {
    remaining: number
    resetAt?: string
  }
}

/**
 * Route a tool call to the correct handler.
 * Enforces rate limits, idempotence, and audit trail.
 */
export async function routeToolCall(
  input: ToolRouterInput
): Promise<ToolRouterOutput> {
  const auth = await requireUser()
  if (!auth.ok) {
    throw new Error("Unauthorized")
  }
  const userId = auth.userId

  const toolCallId = input.clientToolCallId || generateToolCallId(
    userId,
    input.sessionId,
    input.toolName,
    input.args
  )

  try {
    // 1. Check rate limit
    const rateLimitResult = await checkToolRateLimit(
      userId,
      input.sessionId,
      input.toolName,
      DEFAULT_RATE_LIMITS,
      input.conversationTurnNumber
    )

    if (!rateLimitResult.allowed) {
      const result: ToolCallResult = {
        success: false,
        error: rateLimitResult.reason || "Rate limit exceeded",
      }

      await logToolCall(userId, input.sessionId, input.toolName, input.args, result, {
        rate_limit_error: true,
        conversation_turn: input.conversationTurnNumber,
        tool_call_id: toolCallId,
      })

      return {
        success: false,
        toolName: input.toolName,
        toolCallId,
        result,
        rateLimitStatus: {
          remaining: 0,
          resetAt: rateLimitResult.retryAfter
            ? new Date(Date.now() + rateLimitResult.retryAfter * 1000).toISOString()
            : undefined,
        },
      }
    }

    // 2. Check idempotence cache
    const cached = await getCachedToolResult(
      userId,
      input.sessionId,
      toolCallId,
      input.toolName
    )

    if (cached) {
      await logToolCall(userId, input.sessionId, input.toolName, input.args, cached, {
        from_cache: true,
        conversation_turn: input.conversationTurnNumber,
        tool_call_id: toolCallId,
      })

      return {
        success: cached.success ?? false,
        toolName: input.toolName,
        toolCallId,
        result: cached,
        rateLimitStatus: { remaining: 0 },
      }
    }

    // 3. Build execution context
    const context: ToolExecutionContext = {
      toolCallId,
      sessionId: input.sessionId,
      jobId: input.jobId,
      userId,
      confirmed: input.confirmed ?? false,
      conversationTurnNumber: input.conversationTurnNumber ?? 1,
      timestamp: new Date().toISOString(),
    }

    // 4. Execute tool
    let result: ToolCallResult
    const toolName = input.toolName as CoachToolName

    switch (toolName) {
      case "createEvidence":
        result = await toolExecution.executeCreateEvidence(
          input.args as unknown as Parameters<typeof toolExecution.executeCreateEvidence>[0],
          context
        )
        break

      case "updateEvidence":
        result = await toolExecution.executeUpdateEvidence(
          input.args as unknown as Parameters<typeof toolExecution.executeUpdateEvidence>[0],
          context
        )
        break

      case "deleteEvidence":
        result = await toolExecution.executeDeleteEvidence(
          input.args as unknown as Parameters<typeof toolExecution.executeDeleteEvidence>[0],
          context
        )
        break

      case "mapEvidenceToRequirement":
        result = await toolExecution.executeMapEvidenceToRequirement(
          input.args as unknown as Parameters<typeof toolExecution.executeMapEvidenceToRequirement>[0],
          context
        )
        break

      case "markRequirementAddressed":
        result = await toolExecution.executeMarkRequirementAddressed(
          input.args as unknown as Parameters<typeof toolExecution.executeMarkRequirementAddressed>[0],
          context
        )
        break

      case "unmapEvidence":
        result = await toolExecution.executeUnmapEvidence(
          input.args as unknown as Parameters<typeof toolExecution.executeUnmapEvidence>[0],
          context
        )
        break

      case "recordOutcome":
        result = await toolExecution.executeRecordOutcome(
          input.args as unknown as Parameters<typeof toolExecution.executeRecordOutcome>[0],
          context
        )
        break

      case "archiveJob":
        result = await toolExecution.executeArchiveJob(
          input.args as unknown as Parameters<typeof toolExecution.executeArchiveJob>[0],
          context
        )
        break

      case "markSessionComplete":
        result = await toolExecution.executeMarkSessionComplete(
          input.args as unknown as Parameters<typeof toolExecution.executeMarkSessionComplete>[0],
          context
        )
        break

      default:
        result = {
          success: false,
          error: `Unknown tool: ${toolName}`,
        }
    }

    // 5. Cache result
    if (result.success) {
      await cacheToolResult(userId, input.sessionId, toolCallId, input.toolName, result)
    }

    // 6. Log result
    await logToolCall(userId, input.sessionId, input.toolName, input.args, result, {
      executed: true,
      conversation_turn: input.conversationTurnNumber,
      tool_call_id: toolCallId,
    })

    return {
      success: result.success ?? false,
      toolName: input.toolName,
      toolCallId,
      result,
      rateLimitStatus: { remaining: 0 },
    }
  } catch (err) {
    const result: ToolCallResult = {
      success: false,
      error: err instanceof Error ? err.message : "Tool execution failed",
    }

    await logToolCall(userId, input.sessionId, input.toolName, input.args, result, {
      exception: err instanceof Error ? err.message : String(err),
      conversation_turn: input.conversationTurnNumber,
      tool_call_id: toolCallId,
    })

    return {
      success: false,
      toolName: input.toolName,
      toolCallId,
      result,
      rateLimitStatus: { remaining: 0 },
    }
  }
}

/**
 * Format a tool call result for streaming back to the client.
 * Used in /api/coach route when streaming tool results.
 */
export function formatToolResultForStream(
  output: ToolRouterOutput
): string {
  if (output.result.success) {
    // Format success message
    const toolName = output.toolName
    const data = output.result.data as Record<string, unknown>

    switch (toolName) {
      case "createEvidence":
        return `Created evidence: **${data.title}**. Added to your career context.`

      case "mapEvidenceToRequirement":
        return `Mapped evidence to this requirement. Status: **${data.status}**.`

      case "markRequirementAddressed":
        return `Marked this requirement as addressed. Status: **${data.status}**.`

      case "unmapEvidence":
        return `Removed that evidence from the requirement. Status: **${data.status}**.`

      case "recordOutcome":
        return `Recorded outcome: **${data.outcome}**. Updated your application pipeline.`

      case "archiveJob":
        return `Archived this job. It's no longer in your active pipeline.`

      case "updateEvidence":
        return `Updated evidence: **${data.title}**.`

      case "deleteEvidence":
        return `Deleted evidence. Updated ${data.affected_jobs} job mappings.`

      case "markSessionComplete":
        return `Marked this coach session complete.`

      default:
        return `Completed ${toolName}.`
    }
  } else {
    // Format error message
    if (output.result.needsConfirmation) {
      return `⚠️ **Confirmation needed**: ${output.result.confirmationPrompt}`
    }

    return `❌ **Failed**: ${output.result.error || "Unknown error"}`
  }
}
