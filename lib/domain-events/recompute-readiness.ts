/**
 * lib/domain-events/recompute-readiness.ts
 *
 * Recomputes readiness for a job and, if the result changed, writes a
 * readiness_changed domain event and updates any persisted readiness state.
 *
 * Called by handle-event.ts when an event's propagation rule includes
 * "readiness" in its recomputes list.
 */

import { createClient } from "@/lib/supabase/server"
import { evaluateReadiness, type ReadinessResult } from "@/lib/readiness/evaluator"
import type { ReadinessSnapshot, DomainEventType, DomainEventInput } from "./event-types"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export interface RecomputeReadinessInput {
  supabase: ServerSupabase
  jobId: string
  userId: string
  triggeredBy: DomainEventType
  emitEvent: (input: DomainEventInput) => Promise<void>
}

/**
 * Fetch the job, evaluate readiness, and emit readiness_changed.
 * Returns the new ReadinessResult, or null if the job couldn't be loaded.
 */
export async function recomputeReadiness({
  supabase,
  jobId,
  userId,
  triggeredBy,
  emitEvent,
}: RecomputeReadinessInput): Promise<ReadinessResult | null> {
  try {
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, status, applied_at, generated_resume, generated_cover_letter, evidence_map, quality_passed, score, score_gaps, gap_clarifications, gaps_addressed")
      .eq("id", jobId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single()

    if (error || !job) return null

    const result = evaluateReadiness(job)
    const snapshot = buildSnapshot(result, triggeredBy)

    await emitEvent({
      event_type: "readiness_changed",
      job_id: jobId,
      user_id: userId,
      source: "system",
      payload: { snapshot },
      invalidates: ["dashboard", "coach_state", "analytics_cache"],
      recomputes: [],
      affected_routes: ["/dashboard", "/jobs", `/jobs/${jobId}`, "/ready-to-apply"],
      severity: "info",
      metadata: { triggered_by: triggeredBy },
    })

    return result
  } catch {
    return null
  }
}

function buildSnapshot(
  result: ReadinessResult,
  triggeredBy: DomainEventType
): ReadinessSnapshot {
  return {
    isReady: result.isReady,
    canApply: result.canApply,
    stage: result.stage,
    outcome: result.outcome,
    blockedReasons: result.blockedReasons,
    checklist: result.checklist,
    nextAction: result.nextAction
      ? { label: result.nextAction.label, href: result.nextAction.href }
      : null,
    invalidated_by: triggeredBy,
    last_evaluated_at: new Date().toISOString(),
  }
}
