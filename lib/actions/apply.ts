"use server"

import { createClient } from "@/lib/supabase/server"
import { evaluateJobReadiness } from "@/lib/readiness"

export interface ApplyResult {
  success: boolean
  error?: string
  applicationId?: string
}

/**
 * Apply to a job - enforces quality_passed gate
 * 
 * This is the canonical apply action. It:
 * 1. Verifies quality_passed === true (Red Team approval)
 * 2. Sets jobs.applied_at and jobs.status = "applied"
 * 3. Creates applications row
 * 4. Logs audit event
 * 
 * No other code path should mark a job as applied.
 */
export async function applyToJob(
  jobId: string,
  method: "manual" | "email" | "portal" | "recruiter" = "manual"
): Promise<ApplyResult> {
  const { authError, notFoundError, qualityGateError, readinessError, applicationError, supabaseError, unknownError } = await import("@/lib/errors/factory")
  const { logError: logErr } = await import("@/lib/errors/logger")
  const { toActionResult: toAction } = await import("@/lib/errors/response")
  const { createCorrelationId } = await import("@/lib/errors/correlation")
  const correlationId = createCorrelationId()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = authError({ code: "NOT_AUTHENTICATED", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    const readiness = await evaluateJobReadiness(jobId, user.id)
    if (!readiness) {
      const err = notFoundError({ code: "JOB_NOT_FOUND", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    if (!readiness.quality_passed) {
      const err = qualityGateError({ code: "QUALITY_REVIEW_REQUIRED", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    if (!readiness.has_resume || !readiness.has_cover_letter) {
      const err = readinessError({ code: "MATERIALS_MISSING", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    if (readiness.is_applied) {
      const err = applicationError({ code: "ALREADY_APPLIED", correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    const appliedAt = new Date().toISOString()
    const { error: jobError } = await supabase
      .from("jobs")
      .update({
        status: "applied",
        applied_at: appliedAt,
      })
      .eq("id", jobId)
      .eq("user_id", user.id)
    if (jobError) {
      const err = supabaseError({ code: "JOB_UPDATE_FAILED", message: jobError.message, correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        user_id: user.id,
        applied_at: appliedAt,
        status: "submitted",
        method: method,
      })
      .select("id")
      .single()
    if (appError) {
      const err = supabaseError({ code: "APPLICATION_INSERT_FAILED", message: appError.message, correlationId })
      logErr(err, { action: "applyToJob" })
      return toAction(err)
    }
    await supabase.from("audit_events").insert({
      user_id: user.id,
      job_id: jobId,
      event_type: "job_applied",
      outcome: "success",
      reason: `Applied via ${method}`,
      metadata: {
        method,
        applied_at: appliedAt,
        application_id: application?.id,
      },
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

