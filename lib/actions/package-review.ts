'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleDomainEvent } from '@/lib/domain-events'

export async function acceptApplicationPackage(jobId: string, format: string, font: string, userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      quality_passed: true,
      generation_status: 'ready',
      updated_at: new Date().toISOString(),
      resume_format: format,
      resume_font: font,
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/ready-to-apply`)
  revalidatePath(`/dashboard`)

  void handleDomainEvent({
    supabase,
    event_type: 'package_reviewed',
    job_id: jobId,
    user_id: userId,
    source: 'package_review_action',
    payload: {
      review_status: 'accepted',
      resume_format: format,
      resume_font: font,
    },
  })

  return { success: true }
}

/**
 * overridePackageQuality
 *
 * Explicit quality override for a quality-failed package. Requires a non-empty
 * reason which is recorded in the package_quality_override domain event.
 *
 * Per product contract: override must be reason-logged before accepting a
 * quality-failed package. The "Override and accept" secondary CTA in
 * ApplicationPackagePreview calls this; the normal accept path does not.
 */
export async function overridePackageQuality(
  jobId: string,
  reason: string,
  userId: string,
): Promise<{ success?: true; error?: string }> {
  const trimmedReason = reason.trim()
  if (!trimmedReason) return { error: 'A reason is required to override quality.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { error: 'Not authenticated' }

  await handleDomainEvent({
    supabase,
    event_type: 'package_quality_override',
    job_id: jobId,
    user_id: userId,
    source: 'package_review_action',
    payload: {
      override_reason: trimmedReason,
      override_requested_at: new Date().toISOString(),
    },
  })

  const { error } = await supabase
    .from('jobs')
    .update({
      quality_passed: true,
      generation_status: 'ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/ready-to-apply`)
  revalidatePath(`/dashboard`)

  // Downstream: also emit package_reviewed so consumers see it as accepted
  await handleDomainEvent({
    supabase,
    event_type: 'package_reviewed',
    job_id: jobId,
    user_id: userId,
    source: 'package_review_action',
    payload: {
      review_status: 'accepted',
      was_quality_override: true,
      override_reason: trimmedReason,
    },
  })

  return { success: true }
}

export async function markPackageNeedsReview(jobId: string, userId: string, reason?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      quality_passed: false,
      generation_status: 'needs_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/ready-to-apply`)
  revalidatePath(`/dashboard`)

  void handleDomainEvent({
    supabase,
    event_type: 'package_invalidated',
    job_id: jobId,
    user_id: userId,
    source: 'package_review_action',
    payload: { reason: reason ?? 'manual_reset' },
  })

  return { success: true }
}
