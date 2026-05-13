'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleDomainEvent } from '@/lib/domain-events'

export interface NewEvidenceInput {
  source_type: string
  source_title: string
  role_name: string | null
  company_name: string | null
  date_range: string | null
  responsibilities: string[] | null
  tools_used: string[] | null
  outcomes: string[] | null
}

export interface UpdateEvidenceInput {
  source_title?: string
  company_name?: string | null
  role_name?: string | null
  date_range?: string | null
  responsibilities?: string[] | null
  tools_used?: string[] | null
  outcomes?: string[] | null
  approved_achievement_bullets?: string[] | null
  confidence_level?: 'high' | 'medium' | 'low'
}

export async function addEvidence(input: NewEvidenceInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: row, error } = await supabase.from('evidence_library').insert({
    user_id: user.id,
    source_type: input.source_type,
    source_title: input.source_title.trim(),
    role_name: input.role_name,
    company_name: input.company_name,
    date_range: input.date_range,
    responsibilities: input.responsibilities,
    tools_used: input.tools_used,
    outcomes: input.outcomes,
    confidence_level: 'medium',
    evidence_weight: 'medium',
    is_user_approved: true,
    is_active: true,
    priority_rank: 0,
  }).select('id').single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/evidence')
  revalidatePath('/dashboard')
  revalidatePath('/jobs')

  void handleDomainEvent({
    supabase,
    event_type: 'evidence_added',
    job_id: null,
    user_id: user.id,
    source: 'evidence_action',
    payload: {
      evidence_id: row?.id ?? null,
      source_type: input.source_type,
      source_title: input.source_title.trim(),
    },
  })

  return { success: true }
}

export async function updateEvidence(id: string, input: UpdateEvidenceInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('evidence_library')
    .update(input)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/evidence')
  revalidatePath('/dashboard')
  revalidatePath('/jobs')

  void handleDomainEvent({
    supabase,
    event_type: 'evidence_updated',
    job_id: null,
    user_id: user.id,
    source: 'evidence_action',
    payload: {
      evidence_id: id,
      updated_fields: Object.keys(input),
    },
  })

  return { success: true }
}

export async function archiveEvidence(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('evidence_library')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/evidence')
  revalidatePath('/dashboard')
  revalidatePath('/jobs')

  void handleDomainEvent({
    supabase,
    event_type: 'evidence_deleted',
    job_id: null,
    user_id: user.id,
    source: 'evidence_action',
    payload: { evidence_id: id, action: 'archived' },
  })

  return { success: true }
}
