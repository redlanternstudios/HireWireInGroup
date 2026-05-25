/**
 * POST /api/coach/evidence-drafts/[draftId]/reject
 * Rejects a pending draft. Does not write to evidence_library.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function logCoachDraftRejectError(
  action: string,
  error: unknown,
  context: Record<string, unknown>,
) {
  console.error("[HireWire] coach draft reject error", {
    action,
    ...context,
    error: error instanceof Error ? error.message : error,
  })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { draftId } = await params

    const { error } = await supabase.from("coach_evidence_drafts")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", draftId).eq("user_id", user.id).eq("status", "pending")

    if (error) {
      logCoachDraftRejectError("reject_draft", error, {
        draft_id: draftId,
        user_id: user.id,
      })
      return NextResponse.json(
        { success: false, error: "update_failed", user_message: "Failed to reject draft." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ok: true })
  } catch (error) {
    console.error("[coach/reject] Error:", error)
    return NextResponse.json(
      { success: false, error: "server_error", user_message: "Something went wrong." },
      { status: 500 }
    )
  }
}
