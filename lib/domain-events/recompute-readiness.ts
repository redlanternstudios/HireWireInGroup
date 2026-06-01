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
import { buildEvidenceMapForJob } from "@/lib/evidence/buildEvidenceMapForJob"
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
    // Recompute canonical evidence map before readiness
    try {
      await buildEvidenceMapForJob({
        supabase,
        userId,
        jobId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evidence map rebuild failed"
      console.error("[readiness] evidence map rebuild failed", {
        jobId,
        userId,
        triggeredBy,
        error: message,
      })

      const { data: job } = await supabase
        .from("jobs")
        .select("evidence_map")
        .eq("id", jobId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle()

      const previousMap =
        job?.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
          ? job.evidence_map as Record<string, unknown>
          : {}

      await supabase
        .from("jobs")
        .update({
          evidence_map: {
            ...previousMap,
            map_build_error: {
              message,
              triggered_by: triggeredBy,
              failed_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", jobId)
        .eq("user_id", userId)

      return null
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, status, applied_at, generated_resume, generated_cover_letter, evidence_map, quality_passed, score, score_gaps, gap_clarifications, gaps_addressed")
      .eq("id", jobId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single()

    if (error || !job) return null

    const { data: proveFitDecisions } = await supabase
      .from("prove_fit_decisions")
      .select("requirement_id, decision, claim_text")
      .eq("job_id", jobId)
      .eq("user_id", userId)

    const result = evaluateReadiness({
      ...job,
      prove_fit_decisions: proveFitDecisions ?? [],
    })
    const snapshot = buildSnapshot(result, triggeredBy)

    await emitEvent({
      event_type: "readiness_changed",
      job_id: jobId,
      user_id: userId,
      source: "system",
      payload: {
        snapshot,
        is_ready: snapshot.isReady,
        can_apply: snapshot.canApply,
        stage: snapshot.stage,
        outcome: snapshot.outcome,
        blocked_reasons: snapshot.blockedReasons,
      },
      invalidates: ["dashboard", "coach_state", "analytics_cache", "ready_to_apply"],
      recomputes: [],
      affected_routes: ["/dashboard", "/jobs", `/jobs/${jobId}`, "/ready-to-apply"],
      severity: "info",
      metadata: { triggered_by: triggeredBy },
    })

    return result
  } catch (error) {
    console.error("[readiness] recompute failed", {
      jobId,
      userId,
      triggeredBy,
      error: error instanceof Error ? error.message : String(error),
    })
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
