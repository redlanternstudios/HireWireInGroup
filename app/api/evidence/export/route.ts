import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('evidence_library')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('priority_rank', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = [
    'source_type,source_title,company_name,role_name,date_range,responsibilities,tools_used,outcomes,confidence_level',
    ...data.map((item: any) => [
      item.source_type,
      '"' + (item.source_title || '').replace(/"/g, '""') + '"',
      '"' + (item.company_name || '').replace(/"/g, '""') + '"',
      '"' + (item.role_name || '').replace(/"/g, '""') + '"',
      '"' + (item.date_range || '').replace(/"/g, '""') + '"',
      '"' + (item.responsibilities || []).join('\n').replace(/"/g, '""') + '"',
      '"' + (item.tools_used || []).join(',').replace(/"/g, '""') + '"',
      '"' + (item.outcomes || []).join('\n').replace(/"/g, '""') + '"',
      item.confidence_level
    ].join(',')).join('\n')
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="evidence_export.csv"',
    },
  })
}
