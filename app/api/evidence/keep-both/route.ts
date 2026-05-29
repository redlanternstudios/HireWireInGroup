import { NextResponse } from "next/server"

import { handleDomainEvent } from "@/lib/domain-events"
import { requireUser } from "@/lib/supabase/require-user"

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await request.json() as { evidence_ids?: string[]; reason?: string }
  const evidenceIds = Array.from(new Set(body.evidence_ids ?? [])).filter(Boolean)
  if (evidenceIds.length < 2) {
    return NextResponse.json({ success: false, error: "At least two evidence_ids are required" }, { status: 400 })
  }

  const { data: rows, error } = await supabase
    .from("evidence_library")
    .select("id")
    .eq("user_id", userId)
    .in("id", evidenceIds)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  if ((rows ?? []).length !== evidenceIds.length) {
    return NextResponse.json({ success: false, error: "One or more evidence records were not found" }, { status: 404 })
  }

  void handleDomainEvent({
    supabase,
    event_type: "coach_action_taken",
    job_id: null,
    user_id: userId,
    source: "evidence_action",
    payload: {
      action: "keep_duplicate_evidence_distinct",
      evidence_ids: evidenceIds,
      reason: body.reason ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
