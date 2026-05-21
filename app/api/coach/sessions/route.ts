/**
 * POST /api/coach/sessions
 * Create a new coach session or resume an existing active one.
 * Body: { jobId, gapRequirement, gapRequirementId? }
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildOpeningPrompt } from "@/lib/coach/buildCoachPrompt"
import { handleDomainEvent } from "@/lib/domain-events"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = user.id

    const body = await request.json()
    const { jobId, gapRequirement, gapRequirementId } = body
    if (!jobId || !gapRequirement || !gapRequirementId) {
      return NextResponse.json(
        { success: false, error: "missing_fields", user_message: "jobId, gapRequirement, and gapRequirementId are required." },
        { status: 400 }
      )
    }

    const { data: ownedJob } = await supabase.from("jobs").select("id,role_title,company_name")
      .eq("id", jobId).eq("user_id", userId).is("deleted_at", null).maybeSingle()

    if (!ownedJob) {
      return NextResponse.json(
        { success: false, error: "job_not_found", user_message: "That job was not found in your workspace." },
        { status: 404 }
      )
    }

    const { data: existing } = await supabase
      .from("coach_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .eq("gap_requirement_id", gapRequirementId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const [msgs, drafts] = await Promise.all([
        supabase.from("coach_messages").select("id,role,content,created_at")
          .eq("session_id", existing.id).order("created_at", { ascending: true }),
        supabase.from("coach_evidence_drafts").select("id,source_title,source_type,proof_snippet,confidence_level,skills,status,created_at")
          .eq("session_id", existing.id).eq("status", "pending"),
      ])
      return NextResponse.json({
        sessionId: existing.id, isNew: false,
        messages: Array.isArray(msgs.data) ? msgs.data : [],
        pendingDrafts: Array.isArray(drafts.data) ? drafts.data : [],
      })
    }

    const { data: newSession, error: sessionError } = await supabase
      .from("coach_sessions")
      .insert({ user_id: userId, job_id: jobId, gap_requirement: gapRequirement,
        gap_requirement_id: gapRequirementId, status: "active" })
      .select("id").single()

    if (sessionError || !newSession) {
      return NextResponse.json(
        { success: false, error: "session_create_failed", user_message: "Failed to create session." },
        { status: 500 }
      )
    }

    const jobTitle = ownedJob.role_title ?? "this role"
    const openingContent = buildOpeningPrompt(gapRequirement, jobTitle)

    const { data: openingMsg } = await supabase.from("coach_messages")
      .insert({ session_id: newSession.id, role: "assistant", content: openingContent })
      .select("id,role,content,created_at").single()

    void handleDomainEvent({
      supabase,
      event_type: "coach_gap_session_started",
      job_id: jobId,
      user_id: userId,
      source: "coach_route",
      payload: {
        session_id: newSession.id,
        requirement_id: gapRequirementId,
        requirement_text: gapRequirement,
      },
    })

    return NextResponse.json({
      sessionId: newSession.id, isNew: true,
      messages: openingMsg ? [openingMsg] : [],
      pendingDrafts: [],
    })
  } catch (error) {
    console.error("[coach/sessions] Error:", error)
    return NextResponse.json(
      { success: false, error: "server_error", user_message: "Something went wrong." },
      { status: 500 }
    )
  }
}
