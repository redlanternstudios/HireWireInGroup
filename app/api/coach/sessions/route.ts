/**
 * POST /api/coach/sessions
 * Create a new coach session or resume an existing active one.
 * Body: { jobId, gapRequirement, gapRequirementId? }
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildOpeningPrompt } from "@/lib/coach/buildCoachPrompt"
import { handleDomainEvent } from "@/lib/domain-events"

function logCoachSessionError(
  action: string,
  error: unknown,
  context: Record<string, unknown>,
) {
  console.error("[HireWire] coach session error", {
    action,
    ...context,
    error: error instanceof Error ? error.message : error,
  })
}

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

    const { data: ownedJob, error: ownedJobError } = await supabase.from("jobs").select("id,role_title,company_name,evidence_map")
      .eq("id", jobId).eq("user_id", userId).is("deleted_at", null).maybeSingle()

    if (ownedJobError) {
      logCoachSessionError("fetch_owned_job", ownedJobError, { job_id: jobId, user_id: userId })
      return NextResponse.json(
        { success: false, error: "job_lookup_failed", user_message: "Could not load that job. Please try again." },
        { status: 500 }
      )
    }

    if (!ownedJob) {
      return NextResponse.json(
        { success: false, error: "job_not_found", user_message: "That job was not found in your workspace." },
        { status: 404 }
      )
    }

    const { data: existing, error: existingError } = await supabase
      .from("coach_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .eq("gap_requirement_id", gapRequirementId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      logCoachSessionError("lookup_existing_session", existingError, {
        job_id: jobId,
        user_id: userId,
        requirement_id: gapRequirementId,
      })
      return NextResponse.json(
        { success: false, error: "session_lookup_failed", user_message: "Could not load the requirement session." },
        { status: 500 }
      )
    }

    if (existing) {
      const [msgs, drafts] = await Promise.all([
        supabase.from("coach_messages").select("id,role,content,created_at")
          .eq("session_id", existing.id).order("created_at", { ascending: true }),
        supabase.from("coach_evidence_drafts").select("id,job_id,requirement_id,source_title,source_type,proof_snippet,confidence_level,skills,status,created_at")
          .eq("session_id", existing.id).eq("status", "pending"),
      ])
      if (msgs.error || drafts.error) {
        logCoachSessionError("load_existing_session_payload", msgs.error ?? drafts.error, {
          session_id: existing.id,
          job_id: jobId,
          user_id: userId,
          requirement_id: gapRequirementId,
        })
        return NextResponse.json(
          { success: false, error: "session_payload_failed", user_message: "Could not load the saved session." },
          { status: 500 }
        )
      }
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
      logCoachSessionError("create_session", sessionError ?? "No session returned", {
        job_id: jobId,
        user_id: userId,
        requirement_id: gapRequirementId,
      })
      return NextResponse.json(
        { success: false, error: "session_create_failed", user_message: "Failed to create session." },
        { status: 500 }
      )
    }

    const evidenceMap =
      ownedJob.evidence_map && typeof ownedJob.evidence_map === "object" && !Array.isArray(ownedJob.evidence_map)
        ? ownedJob.evidence_map as { requirement_matches?: Array<Record<string, unknown>> }
        : null
    const requirementMatch = evidenceMap?.requirement_matches?.find(
      (match) => match.requirement_id === gapRequirementId
    )
    const jobTitle = ownedJob.role_title ?? "this role"
    const openingContent = buildOpeningPrompt(gapRequirement, jobTitle, {
      company: ownedJob.company_name,
      intent: typeof requirementMatch?.employer_intent === "string" ? requirementMatch.employer_intent : null,
      recoveryQuestion: typeof requirementMatch?.recovery_question === "string" ? requirementMatch.recovery_question : null,
    })

    const { data: openingMsg, error: openingMsgError } = await supabase.from("coach_messages")
      .insert({ session_id: newSession.id, role: "assistant", content: openingContent })
      .select("id,role,content,created_at").single()

    if (openingMsgError) {
      logCoachSessionError("create_opening_message", openingMsgError, {
        session_id: newSession.id,
        job_id: jobId,
        user_id: userId,
        requirement_id: gapRequirementId,
      })
    }

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
