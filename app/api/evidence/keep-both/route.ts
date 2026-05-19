import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { handleDomainEvent } from "@/lib/domain-events"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as { evidence_ids?: string[]; reason?: string }
  const evidenceIds = Array.from(new Set(body.evidence_ids ?? [])).filter(Boolean)
  if (evidenceIds.length < 2) {
    return NextResponse.json({ success: false, error: "At least two evidence_ids are required" }, { status: 400 })
  }

  const { data: rows, error } = await supabase
    .from("evidence_library")
    .select("id")
    .eq("user_id", user.id)
    .in("id", evidenceIds)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  if ((rows ?? []).length !== evidenceIds.length) {
    return NextResponse.json({ success: false, error: "One or more evidence records were not found" }, { status: 404 })
  }

  void handleDomainEvent({
    supabase,
    event_type: "coach_action_taken",
    job_id: null,
    user_id: user.id,
    source: "evidence_action",
    payload: {
      action: "keep_duplicate_evidence_distinct",
      evidence_ids: evidenceIds,
      reason: body.reason ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
