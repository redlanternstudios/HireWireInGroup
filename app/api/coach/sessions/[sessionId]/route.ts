/**
 * GET /api/coach/sessions/[sessionId]
 * Fetch a session with all messages and drafts. Used on page load.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { sessionId } = await params
    const { data: session } = await supabase
      .from("coach_sessions")
      .select("id,job_id,gap_requirement,gap_requirement_id,status,created_at,updated_at")
      .eq("id", sessionId).eq("user_id", user.id).maybeSingle()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "not_found", user_message: "Session not found." },
        { status: 404 }
      )
    }

    const [msgs, drafts] = await Promise.all([
      supabase.from("coach_messages").select("id,role,content,created_at")
        .eq("session_id", sessionId).order("created_at", { ascending: true }),
      supabase.from("coach_evidence_drafts")
        .select("id,job_id,requirement_id,source_title,source_type,proof_snippet,confidence_level,skills,status,created_at")
        .eq("session_id", sessionId).neq("status", "rejected"),
    ])

    return NextResponse.json({
      session,
      messages: Array.isArray(msgs.data) ? msgs.data : [],
      drafts: Array.isArray(drafts.data) ? drafts.data : [],
    })
  } catch (error) {
    console.error("[coach/sessions/[id]] Error:", error)
    return NextResponse.json(
      { success: false, error: "server_error", user_message: "Something went wrong." },
      { status: 500 }
    )
  }
}
