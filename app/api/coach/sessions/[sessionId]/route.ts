/**
 * GET /api/coach/sessions/[sessionId]
 * Fetch a session with all messages and drafts. Used on page load.
 */
import { type NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/require-user"

function logCoachSessionReadError(
  action: string,
  error: unknown,
  context: Record<string, unknown>,
) {
  console.error("[HireWire] coach session read error", {
    action,
    ...context,
    error: error instanceof Error ? error.message : error,
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    const { sessionId } = await params
    const { data: session, error: sessionError } = await supabase
      .from("coach_sessions")
      .select("id,job_id,gap_requirement,gap_requirement_id,status,created_at,updated_at")
      .eq("id", sessionId).eq("user_id", userId).maybeSingle()

    if (sessionError) {
      logCoachSessionReadError("load_session", sessionError, {
        session_id: sessionId,
        user_id: userId,
      })
      return NextResponse.json(
        { success: false, error: "session_lookup_failed", user_message: "Could not load that session." },
        { status: 500 }
      )
    }

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

    if (msgs.error || drafts.error) {
      logCoachSessionReadError("load_session_payload", msgs.error ?? drafts.error, {
        session_id: sessionId,
        user_id: userId,
      })
      return NextResponse.json(
        { success: false, error: "session_payload_failed", user_message: "Could not load session messages." },
        { status: 500 }
      )
    }

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
