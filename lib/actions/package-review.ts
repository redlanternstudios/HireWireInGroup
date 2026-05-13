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
      package_review_status: 'accepted',
      package_reviewed_at: new Date().toISOString(),
      package_reviewed_by: userId,
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

export async function markPackageNeedsReview(jobId: string, userId: string, reason?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      package_review_status: 'needs_review',
      package_reviewed_at: null,
      package_reviewed_by: null,
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
