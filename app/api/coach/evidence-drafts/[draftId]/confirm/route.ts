/**
 * POST /api/coach/evidence-drafts/[draftId]/confirm
 * Confirms a draft → inserts into evidence_library, marks draft confirmed.
 * Body: { proofSnippet?: string } (optional user edit)
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleDomainEvent } from "@/lib/domain-events"
import { mapConfirmedEvidenceToRequirement } from "@/lib/evidence/mapConfirmedEvidenceToRequirement"

type ConfirmSupabase = Awaited<ReturnType<typeof createClient>>

async function mapWithConflictRetry(params: {
  supabase: ConfirmSupabase
  userId: string
  jobId: string
  sessionId: string
  requirementId: string
  evidenceId: string
  evidenceTitle?: string | null
  evidenceType?: string | null
}) {
  try {
    return await mapConfirmedEvidenceToRequirement(params)
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "evidence_map_conflict") {
      throw error
    }
    return mapConfirmedEvidenceToRequirement(params)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = user.id
    const { draftId } = await params

    let userEditedSnippet: string | null = null
    try {
      const body = await request.json()
      userEditedSnippet = body.proofSnippet ?? null
    } catch { /* body is optional */ }

    const { data: draft } = await supabase.from("coach_evidence_drafts")
      .select("id,session_id,job_id,requirement_id,source_title,source_type,proof_snippet,confidence_level,skills,status")
      .eq("id", draftId).eq("user_id", userId).maybeSingle()

    if (!draft) return NextResponse.json({ success: false, error: "not_found" }, { status: 404 })
    if (draft.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "already_processed", user_message: `Draft already ${draft.status}.` },
        { status: 400 }
      )
    }

    const finalSnippet = userEditedSnippet ?? draft.proof_snippet

    const { data: session } = await supabase.from("coach_sessions")
      .select("id,job_id,gap_requirement,gap_requirement_id")
      .eq("id", draft.session_id)
      .eq("user_id", userId)
      .maybeSingle()

    const anchoredJobId = draft.job_id ?? session?.job_id ?? null
    const anchoredRequirementId = draft.requirement_id ?? session?.gap_requirement_id ?? null

    if (!anchoredJobId || !anchoredRequirementId) {
      return NextResponse.json(
        { success: false, error: "requirement_anchor_missing", user_message: "This coach draft is not anchored to a job requirement." },
        { status: 400 }
      )
    }

    const { data: evidenceRow, error: evidenceError } = await supabase
      .from("evidence_library")
      .insert({
        user_id: userId,
        source_type: draft.source_type,
        source_title: draft.source_title,
        proof_snippet: finalSnippet,
        confidence_level: draft.confidence_level,
        tools_used: Array.isArray(draft.skills) ? draft.skills : [],
        is_active: true,
        raw_resume_section: "coach",
        confidence_score: 0.9,
      })
      .select("id").single()

    if (evidenceError || !evidenceRow) {
      return NextResponse.json(
        { success: false, error: "insert_failed", user_message: "Failed to save evidence." },
        { status: 500 }
      )
    }

    const mappingResult = await mapWithConflictRetry({
      supabase,
      userId,
      jobId: anchoredJobId,
      sessionId: session?.id ?? draft.session_id,
      requirementId: anchoredRequirementId,
      evidenceId: evidenceRow.id,
      evidenceTitle: draft.source_title,
      evidenceType: draft.source_type,
    })

    await supabase.from("coach_evidence_drafts")
      .update({
        status: "confirmed",
        confirmed_row_id: evidenceRow.id,
        proof_snippet: finalSnippet,
        job_id: anchoredJobId,
        requirement_id: anchoredRequirementId,
      })
      .eq("id", draftId).eq("user_id", userId)

    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: anchoredJobId,
      user_id: userId,
      source: "coach_route",
      payload: {
        evidence_id: evidenceRow.id,
        requirement_id: anchoredRequirementId,
        gap_requirement: session?.gap_requirement ?? null,
        prev_status: mappingResult.prevStatus,
        new_status: mappingResult.newStatus,
        source_type: draft.source_type,
        source_title: draft.source_title,
        via: "coach_draft_confirm",
      },
    })

    await handleDomainEvent({
      supabase,
      event_type: "requirement_addressed",
      job_id: anchoredJobId,
      user_id: userId,
      source: "coach_route",
      payload: {
        evidence_id: evidenceRow.id,
        requirement_id: anchoredRequirementId,
        prev_status: mappingResult.prevStatus,
        new_status: mappingResult.newStatus,
        via: "coach_draft_confirm",
      },
    })

    const { data: jobState } = await supabase
      .from("jobs")
      .select("generation_status, generated_resume, generated_cover_letter")
      .eq("id", anchoredJobId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle()

    const hasGeneratedDocuments = !!(
      jobState?.generated_resume || jobState?.generated_cover_letter
    )

    if (jobState?.generation_status === "ready" && hasGeneratedDocuments) {
      await supabase
        .from("jobs")
        .update({ generation_status: "needs_review" })
        .eq("id", anchoredJobId)
        .eq("user_id", userId)
        .is("deleted_at", null)

      await handleDomainEvent({
        supabase,
        event_type: "package_invalidated",
        job_id: anchoredJobId,
        user_id: userId,
        source: "coach_route",
        payload: {
          reason: "new_evidence_confirmed",
          evidence_id: evidenceRow.id,
          requirement_id: anchoredRequirementId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      evidenceId: evidenceRow.id,
      requirementId: anchoredRequirementId,
      prevStatus: mappingResult.prevStatus,
      newStatus: mappingResult.newStatus,
    })
  } catch (error) {
    console.error("[coach/confirm] Error:", error)
    return NextResponse.json(
      { success: false, error: "server_error", user_message: "Something went wrong." },
      { status: 500 }
    )
  }
}
