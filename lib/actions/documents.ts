'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  normalizeResumeFont,
  normalizeResumeFormat,
  type ResumeFontId,
  type ResumeFormatId,
} from '@/lib/resume-formats'
import { handleDomainEvent } from '@/lib/domain-events'

export async function saveDocumentEdits(
  jobId: string,
  editedResume: string | null,
  editedCoverLetter: string | null
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Editing content invalidates quality and package acceptance — the job must
  // go through review again before applying.
  const { error } = await supabase
    .from('jobs')
    .update({
      edited_resume: editedResume,
      edited_cover_letter: editedCoverLetter,
      last_edited_at: new Date().toISOString(),
      quality_passed: false,
      package_review_status: 'needs_review',
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/ready-to-apply`)
  revalidatePath(`/dashboard`)

  void handleDomainEvent({
    supabase,
    event_type: 'document_edited',
    job_id: jobId,
    user_id: user.id,
    source: 'document_action',
    payload: {
      has_resume_edit: !!editedResume,
      has_cover_edit: !!editedCoverLetter,
      quality_invalidated: true,
      package_review_reset: true,
    },
  })

  return { success: true }
}

export async function resetDocumentEdits(
  jobId: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      edited_resume: null,
      edited_cover_letter: null,
      last_edited_at: null,
      package_review_status: 'needs_review',
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/ready-to-apply`)

  void handleDomainEvent({
    supabase,
    event_type: 'package_invalidated',
    job_id: jobId,
    user_id: user.id,
    source: 'document_action',
    payload: { reason: 'edits_reset' },
  })

  return { success: true }
}

export async function saveDocumentFormatSettings(
  jobId: string,
  resumeFormat: ResumeFormatId,
  resumeFont: ResumeFontId,
  recommendationReason: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const format = normalizeResumeFormat(resumeFormat)
  const font = normalizeResumeFont(resumeFont, format)

  const { error } = await supabase
    .from('jobs')
    .update({
      resume_format: format,
      resume_font: font,
      format_recommendation_reason: recommendationReason,
      // Format/font changes require re-review of the package
      package_review_status: 'needs_review',
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  revalidatePath(`/ready-to-apply`)

  void handleDomainEvent({
    supabase,
    event_type: 'format_changed',
    job_id: jobId,
    user_id: user.id,
    source: 'document_action',
    payload: { resume_format: format, resume_font: font },
  })

  return { success: true }
}
