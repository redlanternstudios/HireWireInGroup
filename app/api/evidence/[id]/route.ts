import { NextResponse } from "next/server"

import { handleDomainEvent } from "@/lib/domain-events"
import { requireUser } from "@/lib/supabase/require-user"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { id } = await params
  const { error } = await supabase
    .from("evidence_library")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  void handleDomainEvent({
    supabase,
    event_type: "evidence_deleted",
    job_id: null,
    user_id: userId,
    source: "evidence_action",
    payload: { evidence_id: id, action: "archive_duplicate" },
  })

  return NextResponse.json({ success: true })
}
