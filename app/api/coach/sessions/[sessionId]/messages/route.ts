/**
 * POST /api/coach/sessions/[sessionId]/messages
 * Send a user message, get a coach response.
 * Parses <evidence_draft> tags and saves them as coach_evidence_drafts rows.
 * Body: { content: string }
 */
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"
import { createClient } from "@/lib/supabase/server"
import { handleDomainEvent } from "@/lib/domain-events"
import {
  buildCoachSystemPrompt,
  parseEvidenceDraft,
  stripEvidenceDraftTag,
  type CoachMessage,
} from "@/lib/coach/buildCoachPrompt"

const MAX_PRIOR = 20

function logCoachMessageError(
  action: string,
  error: unknown,
  context: Record<string, unknown>,
) {
  console.error("[HireWire] coach message error", {
    action,
    ...context,
    error: error instanceof Error ? error.message : error,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = user.id
    const { sessionId } = await params

    const body = await request.json()
    const userContent: string = (body.content ?? "").trim()
    if (!userContent) {
      return NextResponse.json(
        { success: false, error: "empty_message", user_message: "Message cannot be empty." },
        { status: 400 }
      )
    }

    const { data: session, error: sessionError } = await supabase.from("coach_sessions")
      .select("id,job_id,gap_requirement,gap_requirement_id,status")
      .eq("id", sessionId).eq("user_id", userId).maybeSingle()

    if (sessionError) {
      logCoachMessageError("load_session", sessionError, { session_id: sessionId, user_id: userId })
      return NextResponse.json(
        { success: false, error: "session_lookup_failed", user_message: "Could not load this session." },
        { status: 500 }
      )
    }

    if (!session) return NextResponse.json({ success: false, error: "not_found" }, { status: 404 })
    if (session.status !== "active") {
      return NextResponse.json(
        { success: false, error: "session_closed", user_message: "This session is closed." },
        { status: 400 }
      )
    }

    const { error: userMessageError } = await supabase.from("coach_messages")
      .insert({ session_id: sessionId, role: "user", content: userContent })

    if (userMessageError) {
      logCoachMessageError("insert_user_message", userMessageError, {
        session_id: sessionId,
        job_id: session.job_id,
        user_id: userId,
      })
      return NextResponse.json(
        { success: false, error: "message_save_failed", user_message: "Could not save your message. Please try again." },
        { status: 500 }
      )
    }

    void handleDomainEvent({
      supabase,
      event_type: "coach_gap_message_added",
      job_id: session.job_id,
      user_id: userId,
      source: "coach_route",
      payload: {
        session_id: sessionId,
        requirement_id: session.gap_requirement_id,
        role: "user",
      },
    })

    const [jobResult, evidenceResult, messagesResult] = await Promise.all([
      supabase.from("jobs").select("role_title,company_name,job_description,evidence_map")
        .eq("id", session.job_id).eq("user_id", userId).maybeSingle(),
      supabase.from("evidence_library").select("source_title")
        .eq("user_id", userId).eq("is_active", true),
      supabase.from("coach_messages").select("role,content")
        .eq("session_id", sessionId).order("created_at", { ascending: true }),
    ])

    if (jobResult.error || evidenceResult.error || messagesResult.error) {
      logCoachMessageError("load_context", jobResult.error ?? evidenceResult.error ?? messagesResult.error, {
        session_id: sessionId,
        job_id: session.job_id,
        user_id: userId,
      })
      return NextResponse.json(
        { success: false, error: "context_load_failed", user_message: "Could not load the context for this response." },
        { status: 500 }
      )
    }

    const job = jobResult.data
    const evidenceMap =
      job?.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
        ? job.evidence_map as { requirement_matches?: Array<Record<string, unknown>> }
        : null
    const requirementMatch = evidenceMap?.requirement_matches?.find(
      (match) => match.requirement_id === session.gap_requirement_id
    )
    const existingTitles = (evidenceResult.data ?? []).map((e) => e.source_title)
    const allMessages: CoachMessage[] = (Array.isArray(messagesResult.data) ? messagesResult.data : [])
      .filter((m) => !(m.role === "user" && m.content === userContent))
      .slice(-MAX_PRIOR)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

    const systemPrompt = buildCoachSystemPrompt({
      gapRequirement: session.gap_requirement,
      requirementId: session.gap_requirement_id,
      requirementIntent: typeof requirementMatch?.employer_intent === "string" ? requirementMatch.employer_intent : null,
      currentEvidence: Array.isArray(requirementMatch?.matched_evidence_titles)
        ? requirementMatch.matched_evidence_titles.filter((item): item is string => typeof item === "string")
        : [],
      jobTitle: job?.role_title ?? "this role",
      jobCompany: job?.company_name ?? "this company",
      jobDescriptionSummary: (job?.job_description ?? "").slice(0, 500),
      existingEvidenceTitles: existingTitles,
      priorMessages: allMessages,
    })

    const aiResult = await generateText({
      model: CLAUDE_MODELS.SONNET,
      system: systemPrompt,
      messages: [...allMessages, { role: "user" as const, content: userContent }],
    })

    const rawText = aiResult.text
    const draftPayload = parseEvidenceDraft(rawText)
    const cleanText = stripEvidenceDraftTag(rawText)

    const { data: assistantMsg, error: assistantMessageError } = await supabase.from("coach_messages")
      .insert({ session_id: sessionId, role: "assistant", content: cleanText })
      .select("id,role,content,created_at").single()

    if (assistantMessageError) {
      logCoachMessageError("insert_assistant_message", assistantMessageError, {
        session_id: sessionId,
        job_id: session.job_id,
        user_id: userId,
      })
      return NextResponse.json(
        { success: false, error: "assistant_message_save_failed", user_message: "Could not save the coach response." },
        { status: 500 }
      )
    }

    let savedDraft = null
    if (draftPayload) {
      const { data: draft, error: draftError } = await supabase.from("coach_evidence_drafts")
        .insert({
          session_id: sessionId,
          user_id: userId,
          job_id: session.job_id,
          requirement_id: session.gap_requirement_id,
          source_title: draftPayload.source_title,
          source_type: draftPayload.source_type,
          proof_snippet: draftPayload.proof_snippet,
          confidence_level: draftPayload.confidence_level,
          skills: draftPayload.skills,
          status: "pending",
        })
        .select("id,job_id,requirement_id,source_title,source_type,proof_snippet,confidence_level,skills,status")
        .single()
      if (draftError) {
        logCoachMessageError("insert_evidence_draft", draftError, {
          session_id: sessionId,
          job_id: session.job_id,
          user_id: userId,
          requirement_id: session.gap_requirement_id,
        })
        return NextResponse.json(
          { success: false, error: "draft_save_failed", user_message: "The coach found proof, but could not save the draft." },
          { status: 500 }
        )
      }
      savedDraft = draft ?? null
      if (savedDraft) {
        void handleDomainEvent({
          supabase,
          event_type: "evidence_draft_created",
          job_id: session.job_id,
          user_id: userId,
          source: "coach_route",
          payload: {
            session_id: sessionId,
            draft_id: savedDraft.id,
            requirement_id: session.gap_requirement_id,
          },
        })
      }
    }

    const { error: sessionUpdateError } = await supabase.from("coach_sessions")
      .update({ updated_at: new Date().toISOString() }).eq("id", sessionId)

    if (sessionUpdateError) {
      logCoachMessageError("touch_session", sessionUpdateError, {
        session_id: sessionId,
        job_id: session.job_id,
        user_id: userId,
      })
    }

    return NextResponse.json({
      message: assistantMsg ?? { role: "assistant", content: cleanText },
      draft: savedDraft,
    })
  } catch (error) {
    console.error("[coach/messages] Error:", error)
    return NextResponse.json(
      { success: false, error: "server_error", user_message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
