import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { detectEvidenceDuplicates, type EvidenceDuplicateRow } from '@/lib/evidence/duplicates'
import { requireUser } from '@/lib/supabase/require-user'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()
  let records: any[] = []
  try {
    records = parse(text, { columns: true, skip_empty_lines: true })
  } catch (e) {
    return NextResponse.json({ error: 'Malformed CSV' }, { status: 400 })
  }

  const candidateRows = records
    .filter((rec) => rec.source_title)
    .map((rec): EvidenceDuplicateRow & Record<string, unknown> => ({
      source_type: rec.source_type || 'work_experience',
      source_title: rec.source_title,
      company_name: rec.company_name || null,
      role_name: rec.role_name || null,
      date_range: rec.date_range || null,
      responsibilities: rec.responsibilities ? rec.responsibilities.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
      tools_used: rec.tools_used ? rec.tools_used.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      outcomes: rec.outcomes ? rec.outcomes.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
      confidence_level: rec.confidence_level || 'medium',
      evidence_weight: 'medium',
      is_active: true,
      is_user_approved: true,
      visibility_status: 'active',
    }))

  const { data: existing } = await supabase
    .from('evidence_library')
    .select('id, source_type, source_title, company_name, role_name, date_range, responsibilities, tools_used, outcomes, proof_snippet')
    .eq('user_id', userId)
    .eq('is_active', true)

  const duplicateCandidates = detectEvidenceDuplicates(candidateRows, existing ?? [])
  const duplicateIndexes = new Set(
    duplicateCandidates.map((candidate) => candidate.group_id.replace('evidence-duplicate-', '')),
  )

  const rowsToInsert = candidateRows.filter((_row, index) => !duplicateIndexes.has(String(index)))
  let imported = 0

  if (rowsToInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from('evidence_library')
      .insert(rowsToInsert.map((row) => ({ ...row, user_id: userId })))
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    imported = inserted?.length ?? 0
  }

  return NextResponse.json({
    imported,
    duplicates_found: duplicateCandidates.length,
    duplicate_candidates: duplicateCandidates,
  })
}
