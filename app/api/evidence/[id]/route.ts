import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { handleDomainEvent } from "@/lib/domain-events"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from("evidence_library")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  void handleDomainEvent({
    supabase,
    event_type: "evidence_deleted",
    job_id: null,
    user_id: user.id,
    source: "evidence_action",
    payload: { evidence_id: id, action: "archive_duplicate" },
  })

  return NextResponse.json({ success: true })
}
