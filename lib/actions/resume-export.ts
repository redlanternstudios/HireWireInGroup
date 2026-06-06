'use server'

import { createClient } from '@/lib/supabase/server'
import { emitDomainEventWithClient } from '@/lib/domain-events/emit-event'

export async function emitPreviewOpenedEvent(jobId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await emitDomainEventWithClient(supabase, {
      event_type: 'resume_preview_opened',
      job_id: jobId,
      user_id: user.id,
      source: 'preview_action',
      payload: { job_id: jobId },
      invalidates: [],
      recomputes: [],
      affected_routes: [],
      severity: 'info',
      metadata: {},
    })
  } catch {
    // Non-blocking — preview events must never interrupt the user
  }
}

export async function emitExportEvent(
  jobId: string,
  format: 'txt' | 'print'
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const eventType = format === 'txt' ? 'resume_txt_exported' : 'resume_print_started'

    await emitDomainEventWithClient(supabase, {
      event_type: eventType,
      job_id: jobId,
      user_id: user.id,
      source: 'resume_export_action',
      payload: { format, job_id: jobId },
      invalidates: [],
      recomputes: [],
      affected_routes: [],
      severity: 'info',
      metadata: {},
    })
  } catch {
    // Non-blocking
  }
}
