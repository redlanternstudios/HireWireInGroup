"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { handleDomainEvent } from "@/lib/domain-events"

export interface PackageActionResult {
  success: boolean
  error?: string
}

/**
 * acceptApplicationPackage
 *
 * Marks a generated resume + cover letter package as accepted by the user.
 * Sets quality_passed = true and generation_status = "ready".
 *
 * Gate: generated_resume and generated_cover_letter must exist.
 * This is the action that unlocks the Apply button in applyToJob().
 *
 * Domain event: package.accepted
 */
export async function acceptApplicationPackage(
  jobId: string,
  overrideReason?: string | null,
): Promise<PackageActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Gate: documents must exist before acceptance
  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, generated_resume, generated_cover_letter, quality_passed, generation_status")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (fetchError || !job) return { success: false, error: "Job not found" }

  if (!job.generated_resume || !job.generated_cover_letter) {
    return {
      success: false,
      error: "Both resume and cover letter must be generated before accepting the package.",
    }
  }

  const previousStatus = job.generation_status as string | null
  const normalizedOverrideReason = overrideReason?.trim() || null

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      quality_passed: true,
      generation_status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", user.id)

  if (updateError) return { success: false, error: updateError.message }

  if (job.quality_passed === false && normalizedOverrideReason) {
    await handleDomainEvent({
      supabase,
      event_type: "package_quality_override",
      job_id: jobId,
      user_id: user.id,
      source: "package_review_action",
      payload: {
        override_reason: normalizedOverrideReason,
        previousStatus,
        overriddenAt: new Date().toISOString(),
      },
      metadata: {
        override_reason: normalizedOverrideReason,
      },
    })
  }

  // Emit domain event — also triggers cache invalidation for /ready-queue, /dashboard
  await handleDomainEvent({
    supabase,
    event_type: "package_reviewed",
    job_id: jobId,
    user_id: user.id,
    source: "package_review_action",
    payload: {
      acceptedAt: new Date().toISOString(),
      previousStatus,
      was_quality_override: job.quality_passed === false && !!normalizedOverrideReason,
      override_reason: normalizedOverrideReason,
    },
  })

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath("/ready-queue")

  return { success: true }
}

/**
 * markPackageNeedsReview
 *
 * Flags the generated package for manual review.
 * Sets quality_passed = false and generation_status = "needs_review".
 *
 * This prevents the Apply button from being shown until the user re-accepts.
 *
 * Domain event: package.needs_review
 */
export async function markPackageNeedsReview(
  jobId: string,
  reason: string
): Promise<PackageActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      quality_passed: false,
      generation_status: "needs_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .is("deleted_at", null)

  if (updateError) return { success: false, error: updateError.message }

  await handleDomainEvent({
    supabase,
    event_type: "package_invalidated",
    job_id: jobId,
    user_id: user.id,
    source: "package_review_action",
    payload: {
      reason,
      flaggedAt: new Date().toISOString(),
    },
  })

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/jobs/${jobId}`)

  return { success: true }
}

/**
 * resetPackageReviewStatus
 *
 * Resets quality_passed to null and generation_status to "needs_review"
 * to allow the user to re-review after editing.
 *
 * Domain event: package.reset
 */
export async function resetPackageReviewStatus(
  jobId: string
): Promise<PackageActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      quality_passed: false,
      generation_status: "needs_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .is("deleted_at", null)

  if (updateError) return { success: false, error: updateError.message }

  await handleDomainEvent({
    supabase,
    event_type: "package_invalidated",
    job_id: jobId,
    user_id: user.id,
    source: "package_review_action",
    payload: { resetAt: new Date().toISOString() },
  })

  revalidatePath(`/jobs/${jobId}/documents`)

  return { success: true }
}
