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
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Evaluate job readiness - this is the authoritative gate
  const readiness = await evaluateJobReadiness(jobId, user.id)
  if (!readiness) {
    return { success: false, error: "Job not found" }
  }
  
  // Enforce quality_passed gate
  if (!readiness.quality_passed) {
    return { 
      success: false, 
      error: "Quality review required. Complete Red Team review before applying." 
    }
  }
  
  // Enforce materials exist
  if (!readiness.has_resume || !readiness.has_cover_letter) {
    return { 
      success: false, 
      error: "Resume and cover letter must be generated before applying." 
    }
  }
  
  // Check not already applied
  if (readiness.is_applied) {
    return { 
      success: false, 
      error: "Already marked as applied to this job." 
    }
  }
  
  const appliedAt = new Date().toISOString()
  
  // Update job status
  const { error: jobError } = await supabase
    .from("jobs")
    .update({
      status: "applied",
      applied_at: appliedAt,
    })
    .eq("id", jobId)
    .eq("user_id", user.id)
  
  if (jobError) {
    return { success: false, error: `Failed to update job: ${jobError.message}` }
  }
  
  // Create applications row
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
    return { success: false, error: `Failed to create application record: ${appError.message}` }
  }
  
  // Log audit event
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
    applicationId: application?.id 
  }
}

