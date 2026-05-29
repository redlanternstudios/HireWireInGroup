import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/supabase/require-user'
import {
  extractGithubUsername,
  fetchGithubProfile,
  buildProfileEvidenceContent,
  buildRepoEvidenceContent,
} from '@/lib/github/parseProfile'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  let body: { link_id?: unknown; github_url?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Resolve GitHub URL — from link_id OR direct URL
  let githubUrl: string | null = null
  let linkId: string | null = null

  if (typeof body.link_id === 'string') {
    linkId = body.link_id
    const { data: link, error: linkErr } = await supabase
      .from('user_profile_links')
      .select('id, url, link_type')
      .eq('id', linkId)
      .eq('user_id', userId)
      .single()
    if (linkErr || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    if (link.link_type !== 'github') {
      return NextResponse.json({ error: 'Link is not a github link' }, { status: 400 })
    }
    githubUrl = link.url
  } else if (typeof body.github_url === 'string') {
    githubUrl = body.github_url
  } else {
    return NextResponse.json({ error: 'Must provide link_id or github_url' }, { status: 400 })
  }

  const username = extractGithubUsername(githubUrl!)
  if (!username) {
    await markLinkFailed(supabase, linkId, 'Invalid GitHub URL')
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
  }

  // Fetch from GitHub
  let fetchResult: Awaited<ReturnType<typeof fetchGithubProfile>>
  try {
    fetchResult = await fetchGithubProfile(username)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'GitHub fetch failed'
    await markLinkFailed(supabase, linkId, msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
  const { profile, repos } = fetchResult

  // Dedup: remove prior github evidence for this user
  const { error: delErr } = await supabase
    .from('evidence_library')
    .delete()
    .eq('user_id', userId)
    .eq('source_type', 'github')
  if (delErr) {
    return NextResponse.json({ error: `Dedup failed: ${delErr.message}` }, { status: 500 })
  }

  // Build rows: 1 profile row + up to 10 repo rows
  // Note: evidence_library uses `proof_snippet` for text content (not `source_content`)
  const rows = [
    {
      user_id: userId,
      source_type: 'github',
      source_title: `GitHub Profile: @${profile.username}`,
      source_url: profile.profile_url,
      proof_snippet: buildProfileEvidenceContent(profile),
      confidence_level: 'high',
      is_active: true,
    },
    ...repos.map(r => ({
      user_id: userId,
      source_type: 'github',
      source_title: `Repo: ${r.name}`,
      source_url: r.html_url,
      proof_snippet: buildRepoEvidenceContent(r),
      confidence_level: 'high',
      is_active: true,
    })),
  ]

  const { error: insErr, data: inserted } = await supabase
    .from('evidence_library')
    .insert(rows)
    .select('id')
  if (insErr) {
    await markLinkFailed(supabase, linkId, insErr.message)
    return NextResponse.json({ error: `Insert failed: ${insErr.message}` }, { status: 500 })
  }

  // Mark link as parsed
  if (linkId) {
    await supabase
      .from('user_profile_links')
      .update({
        parse_status: 'complete',
        parse_error: null,
        last_parsed_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .eq('user_id', userId)
  }

  return NextResponse.json({
    ok: true,
    username,
    evidence_created: inserted?.length ?? 0,
    repos_parsed: repos.length,
  })
}

async function markLinkFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  linkId: string | null,
  errorMsg: string
) {
  if (!linkId) return
  await supabase
    .from('user_profile_links')
    .update({
      parse_status: 'failed',
      parse_error: errorMsg.slice(0, 500),
      last_parsed_at: new Date().toISOString(),
    })
    .eq('id', linkId)
}
