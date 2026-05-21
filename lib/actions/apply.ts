"use server"

import { createClient } from "@/lib/supabase/server"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { handleDomainEvent } from "@/lib/domain-events"
import { authError, notFoundError, applicationError, supabaseError, unknownError } from "@/lib/errors/factory"
import { logError as logErr } from "@/lib/errors/logger"
import { toActionResult as toAction } from "@/lib/errors/response"
import { createCorrelationId } from "@/lib/errors/correlation"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>
type ApplyMethod = "manual" | "email" | "portal" | "recruiter"

export interface ApplyResult {
  success: boolean
  error?: string
  applicationId?: string
  reasons?: string[]
  correlationId?: string
}

/**
 * Apply to a job — the canonical apply action.
 *
 * Enforces the readiness gate, creates the applications row, updates job state,
 * and emits application_submitted + readiness_changed domain events.
 *
 * No other code path may mark a job as applied.
 */
export async function applyToJob(
  jobId: string,
  methodOrOverride: ApplyMethod | boolean = "manual",
  overrideOrReason: boolean | string = false,
  overrideReason?: string
): Promise<ApplyResult> {
  const correlationId = createCorrelationId()
  const method: ApplyMethod = typeof methodOrOverride === "string" ? methodOrOverride : "manual"
  const shouldOverride = typeof methodOrOverride === "boolean"
    ? methodOrOverride
    : overrideOrReason === true
  const overrideNote = typeof methodOrOverride === "boolean" && typeof overrideOrReason === "string"
    ? overrideOrReason
    : overrideReason

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = authError({ code: "NOT_AUTHENTICATED", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }

    const { data: job, error: jobFetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (jobFetchError || !job) {
      const err = notFoundError({ code: "JOB_NOT_FOUND", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }

    if (job.applied_at !== null || job.status === "applied") {
      const err = applicationError({ code: "ALREADY_APPLIED", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }

    const readiness = evaluateReadiness(job)

    if (!readiness.isReady && !shouldOverride) {
      return {
        success: false,
        error: "APPLICATION_BLOCKED",
        reasons: readiness.blockedReasons,
        correlationId,
      }
    }

    if (!readiness.isReady && shouldOverride) {
      await logOverride({
        supabase,
        jobId,
        userId: user.id,
        reasons: readiness.blockedReasons,
        overrideReason: overrideNote,
        correlationId,
      })

      await handleDomainEvent({
        supabase,
        event_type: "override_logged",
        job_id: jobId,
        user_id: user.id,
        source: "apply_action",
        payload: {
          reasons: readiness.blockedReasons,
          override_reason: overrideNote ?? null,
          correlation_id: correlationId,
        },
      })
    }

    const appliedAt = new Date().toISOString()

    // Update job first — if this fails, nothing is created
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "applied", applied_at: appliedAt })
      .eq("id", jobId)
      .eq("user_id", user.id)

    if (jobError) {
      const err = supabaseError({ code: "JOB_UPDATE_FAILED", message: jobError.message, correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }

    // Insert application row
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        user_id: user.id,
        applied_at: appliedAt,
        status: "submitted",
        method,
      })
      .select("id")
      .single()

    if (appError) {
      // Rollback: revert job status so no partial apply state persists
      await supabase
        .from("jobs")
        .update({ status: job.status ?? "analyzed", applied_at: null })
        .eq("id", jobId)
        .eq("user_id", user.id)

      const err = supabaseError({ code: "APPLICATION_INSERT_FAILED", message: appError.message, correlationId })
      logErr(err, { action: "applyToJob" })

      await handleDomainEvent({
        supabase,
        event_type: "application_failed",
        job_id: jobId,
        user_id: user.id,
        source: "apply_action",
        payload: { error: appError.message, correlation_id: correlationId },
        metadata: { correlation_id: correlationId },
      })

      return toAction(err)
    }

    // Emit application_submitted — triggers analytics, logs, dashboard, coach
    await handleDomainEvent({
      supabase,
      event_type: "application_submitted",
      job_id: jobId,
      user_id: user.id,
      source: "apply_action",
      payload: {
        method,
        applied_at: appliedAt,
        application_id: application?.id,
        was_override: shouldOverride && !readiness.isReady,
        correlation_id: correlationId,
      },
      metadata: { correlation_id: correlationId },
    })

    return {
      success: true,
      applicationId: application?.id,
      correlationId,
    }
  } catch (err) {
    const errorObj = unknownError({ code: "APPLY_TO_JOB_EXCEPTION", cause: err, correlationId })
    logErr(errorObj, { action: "applyToJob" })
    return toAction(errorObj)
  }
}

async function logOverride({
  supabase,
  jobId,
  userId,
  reasons,
  overrideReason,
  correlationId,
}: {
  supabase: ServerSupabase
  jobId: string
  userId: string
  reasons: string[]
  overrideReason?: string
  correlationId: string
}) {
  const createdAt = new Date().toISOString()
  const reason = overrideReason?.trim() || null

  const { error } = await supabase.from("application_events").insert({
    job_id: jobId,
    user_id: userId,
    type: "override",
    reasons,
    reason,
    created_at: createdAt,
  })

  if (!error) return

  await supabase.from("audit_events").insert({
    user_id: userId,
    job_id: jobId,
    event_type: "application_override",
    outcome: "warning",
    reason: reason ?? reasons.join(", "),
    metadata: {
      reasons,
      override_reason: reason,
      correlation_id: correlationId,
      application_events_error: error.message,
    },
  })
}
