import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

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

  let imported = 0
  for (const rec of records) {
    if (!rec.source_title) continue
    await supabase.from('evidence_library').insert({
      user_id: user.id,
      source_type: rec.source_type || 'work_experience',
      source_title: rec.source_title,
      company_name: rec.company_name || null,
      role_name: rec.role_name || null,
      date_range: rec.date_range || null,
      responsibilities: rec.responsibilities ? rec.responsibilities.split('\n') : [],
      tools_used: rec.tools_used ? rec.tools_used.split(',') : [],
      outcomes: rec.outcomes ? rec.outcomes.split('\n') : [],
      confidence_level: rec.confidence_level || 'medium',
      evidence_weight: 'medium',
      is_active: true,
      is_user_approved: true,
      visibility_status: 'active',
    })
    imported++
  }
  return NextResponse.json({ imported })
}
