import { NextRequest, NextResponse } from "next/server"
import { importGithubEvidence } from "@/lib/github/importEvidence"
import { requireUser } from "@/lib/supabase/require-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  let body: { link_id?: unknown; github_url?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const result = await importGithubEvidence(supabase, userId, {
    linkId: typeof body.link_id === "string" ? body.link_id : undefined,
    githubUrl: typeof body.github_url === "string" ? body.github_url : undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    username: result.username,
    evidence_created: result.evidence_created,
    repos_parsed: result.repos_parsed,
  })
}
