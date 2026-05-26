import { type NextRequest, NextResponse } from "next/server"

import { cleanGapLabel, getCoachStepState, withCoachStepMeta } from "@/lib/coach-step"
import { validateCoachAnswer } from "@/lib/coach/claim-validator"
import {
  asCanonicalEvidenceMap,
  buildConflictResponse,
  deleteInsertedEvidence,
  emitCoachEvent,
  guardedCoachStepUpdate,
  loadEvidenceRows,
  upsertProveFitDecision,
  withUpdatedRequirementMatches,
} from "@/lib/coach/coach-step-helpers"
import { createClient } from "@/lib/supabase/server"

type CoachStepBody =
  | { action: "answer"; gap: string; requirementId?: string; answer: string; force_save?: boolean }
  | { action: "skip"; gap?: string; requirementId?: string }
  | { action: "complete" }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as CoachStepBody
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id,role_title,company_name,evidence_map,evidence_map_version,score,score_gaps,gap_clarifications,gaps_addressed")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (error || !job) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 })
  }

  if (body.action === "skip") {
    const skippedGap = typeof body.gap === "string" ? cleanGapLabel(body.gap) : null
    const skippedRequirementId =
      typeof body.requirementId === "string" && body.requirementId.trim().length > 0
        ? body.requirementId
        : null
    const existingClarifications = Array.isArray(job.gap_clarifications)
      ? job.gap_clarifications
      : []
    const existingAddressed = Array.isArray(job.gaps_addressed)
      ? job.gaps_addressed.map(cleanGapLabel)
      : []
    const updatedAddressed = skippedGap
      ? Array.from(new Set([...existingAddressed, skippedGap]))
      : existingAddressed
    const updatedClarifications = skippedGap
      ? [
          ...existingClarifications.filter((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return true
            return cleanGapLabel(String((item as Record<string, unknown>).gap_requirement ?? "")) !== skippedGap
          }),
          {
            gap_requirement: skippedGap,
            requirement_id: skippedRequirementId,
            answer: "",
            routing: "match_interview_skip",
            skipped: true,
            skipped_at: new Date().toISOString(),
          },
        ]
      : existingClarifications

    const canonicalMap = asCanonicalEvidenceMap(job.evidence_map)
    const evidenceRows = canonicalMap
      ? await loadEvidenceRows(supabase, user.id)
      : []
    const nextEvidenceMap = canonicalMap && skippedRequirementId
      ? withUpdatedRequirementMatches(
          job.evidence_map,
          canonicalMap.requirement_matches.map((match) =>
            match.requirement_id === skippedRequirementId
              ? {
                  ...match,
                  proof_decision: "skipped",
                  skip_reason: "User chose to skip this claim in the Match Interview.",
                  skipped_at: new Date().toISOString(),
                  reasoning: "User explicitly skipped this requirement; generated materials must not claim it.",
                  riskFlags: Array.from(new Set([...(match.riskFlags ?? []), "user_skipped"])),
                  updated_at: new Date().toISOString(),
                }
              : match,
          ),
          evidenceRows,
        )
      : job.evidence_map
    const nextState = getCoachStepState({
      ...job,
      gap_clarifications: updatedClarifications,
      gaps_addressed: updatedAddressed,
      evidence_map: nextEvidenceMap,
    })

    const update = await guardedCoachStepUpdate({
      supabase,
      userId: user.id,
      jobId: id,
      currentVersion: job.evidence_map_version ?? null,
      values: {
        gap_clarifications: updatedClarifications,
        gaps_addressed: updatedAddressed,
        evidence_map: withCoachStepMeta(nextEvidenceMap, nextState.remainingGaps.length === 0 ? "completed" : "required", {
          skipped_at: new Date().toISOString(),
          skipped_gap: skippedGap,
          skipped_requirement_id: skippedRequirementId,
          remaining_gaps: nextState.remainingGaps,
        }),
      },
    })

    if (update.error) {
      return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
    }
    if (update.conflict) {
      return buildConflictResponse(supabase, user.id, id)
    }

    if (skippedRequirementId && skippedGap) {
      await upsertProveFitDecision(supabase, {
        userId: user.id,
        jobId: id,
        requirementId: skippedRequirementId,
        requirementText: skippedGap,
        decision: "skipped",
        skipReason: "User chose to skip this claim in the Match Interview.",
      })
    }

    await emitCoachEvent(supabase, user.id, id, "skipped", {
      gap: skippedGap,
      requirement_id: skippedRequirementId,
    })
    return NextResponse.json({
      success: true,
      coachStep: getCoachStepState({
        ...job,
        gap_clarifications: updatedClarifications,
        gaps_addressed: updatedAddressed,
        evidence_map: nextEvidenceMap,
      }),
      evidenceMapVersion: update.nextVersion,
    })
  }

  if (body.action === "complete") {
    const update = await guardedCoachStepUpdate({
      supabase,
      userId: user.id,
      jobId: id,
      currentVersion: job.evidence_map_version ?? null,
      values: {
        evidence_map: withCoachStepMeta(job.evidence_map, "completed", {
          completed_at: new Date().toISOString(),
        }),
      },
    })

    if (update.error) {
      return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
    }
    if (update.conflict) {
      return buildConflictResponse(supabase, user.id, id)
    }

    await emitCoachEvent(supabase, user.id, id, "completed", {})
    return NextResponse.json({
      success: true,
      coachStep: { status: "completed" },
      evidenceMapVersion: update.nextVersion,
    })
  }

  if (body.action !== "answer") {
    return NextResponse.json({ success: false, error: "invalid_action" }, { status: 400 })
  }

  const gap = cleanGapLabel(body.gap ?? "")
  const answer = String(body.answer ?? "").trim()
  const forceSave = body.action === "answer" && !!body.force_save
  if (!gap || answer.length < 8) {
    return NextResponse.json(
      { success: false, error: "invalid_answer", user_message: "Add a little more detail before saving." },
      { status: 400 },
    )
  }

  // Signal-based validation — gate on thin answers unless user force-saves
  const answerValidation = validateCoachAnswer(answer, gap)
  if (answerValidation.needsMoreDetail && !forceSave) {
    return NextResponse.json(
      {
        success: false,
        error: "answer_needs_detail",
        user_message: answerValidation.coaching_nudge,
        can_force_save: answerValidation.can_force_save,
      },
      { status: 422 },
    )
  }

  const existingMap =
    job.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
      ? job.evidence_map as Record<string, unknown>
      : {}
  const canonicalMap = asCanonicalEvidenceMap(job.evidence_map)
  const existingGapEntry =
    existingMap[gap] && typeof existingMap[gap] === "object" && !Array.isArray(existingMap[gap])
      ? existingMap[gap] as Record<string, unknown>
      : {}
  const existingClarifications = Array.isArray(job.gap_clarifications)
    ? job.gap_clarifications
    : []
  const existingAddressed = Array.isArray(job.gaps_addressed)
    ? job.gaps_addressed.map(cleanGapLabel)
    : []
  const updatedAddressed = Array.from(new Set([...existingAddressed, gap]))
  const updatedClarifications = [
    ...existingClarifications.filter((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return true
      return cleanGapLabel(String((item as Record<string, unknown>).gap_requirement ?? "")) !== gap
    }),
    {
      gap_requirement: gap,
      requirement_id: body.requirementId ?? null,
      question: `What real experience supports ${gap}?`,
      answer,
      routing: "match_interview",
      addressed_at: new Date().toISOString(),
    },
  ]

  let insertedEvidenceId: string | null = null
  let insertedEvidenceTitle: string | null = null
  let insertedEvidenceType: string | null = null
  let evidenceRows: Record<string, unknown>[] = []

  if (canonicalMap && body.requirementId) {
    const requirement = canonicalMap.requirement_matches.find(
      (match) => match.requirement_id === body.requirementId,
    )
    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "requirement_not_found", user_message: "That Match Interview question is no longer available." },
        { status: 404 },
      )
    }

    insertedEvidenceTitle = `Confirmed fit: ${requirement.normalized_requirement || requirement.requirement_text}`.slice(0, 180)
    insertedEvidenceType = "user_input"
    const { data: evidenceRow, error: evidenceError } = await supabase
      .from("evidence_library")
      .insert({
        user_id: user.id,
        source_type: insertedEvidenceType,
        source_title: insertedEvidenceTitle,
        proof_snippet: answer,
        confidence_level: "medium",
        confidence_score: answerValidation.confidence,
        is_active: true,
        is_user_approved: true,
        raw_resume_section: "match_interview",
        responsibilities: [requirement.requirement_text],
        approved_keywords: requirement.related_skills ?? [],
        normalized_label: requirement.normalized_requirement,
        what_not_to_overstate: answerValidation.what_not_to_overstate,
      })
      .select("id")
      .single()

    if (evidenceError || !evidenceRow) {
      return NextResponse.json(
        { success: false, error: "insert_failed", user_message: "Could not save that confirmed claim." },
        { status: 500 },
      )
    }

    insertedEvidenceId = evidenceRow.id
    evidenceRows = await loadEvidenceRows(supabase, user.id)
  }

  const provisionalJob = {
    ...job,
    gap_clarifications: updatedClarifications,
    gaps_addressed: updatedAddressed,
    evidence_map: canonicalMap && body.requirementId
      ? withUpdatedRequirementMatches(
          job.evidence_map,
          canonicalMap.requirement_matches.map((match) =>
            match.requirement_id === body.requirementId && insertedEvidenceId
              ? {
                  ...match,
                  status: match.status === "met" ? "met" : "partial",
                  matched_evidence_ids: Array.from(new Set([...match.matched_evidence_ids, insertedEvidenceId])),
                  matched_evidence_titles: Array.from(new Set([
                    ...match.matched_evidence_titles,
                    insertedEvidenceTitle ?? "Confirmed Match Interview claim",
                  ])),
                  evidence_types: Array.from(new Set([
                    ...match.evidence_types,
                    insertedEvidenceType ?? "user_input",
                  ])),
                  confidence: match.confidence === "high" ? "high" : "medium",
                  match_method: "manual",
                  reasoning: "User confirmed this claim in the Match Interview. Use exactly what was confirmed; do not overstate it.",
                  riskFlags: (match.riskFlags ?? []).filter((flag) =>
                    !["missing_evidence", "no_packet_evidence"].includes(flag),
                  ),
                  proof_decision: "confirmed",
                  user_claim: answer,
                  skip_reason: null,
                  confirmed_at: new Date().toISOString(),
                  skipped_at: null,
                  mapped_by_session_ids: match.mapped_by_session_ids,
                  updated_at: new Date().toISOString(),
                }
              : match,
          ),
          evidenceRows,
        )
      : {
          ...existingMap,
          [gap]: {
            ...existingGapEntry,
            coach_answer: answer,
            source: "coach_step",
            answered_at: new Date().toISOString(),
          },
        },
  }
  const nextState = getCoachStepState(provisionalJob)
  const evidenceMap = withCoachStepMeta(
    provisionalJob.evidence_map,
    nextState.remainingGaps.length === 0 ? "completed" : "required",
    nextState.remainingGaps.length === 0
      ? { completed_at: new Date().toISOString() }
      : { remaining_gaps: nextState.remainingGaps },
  )

  const update = await guardedCoachStepUpdate({
    supabase,
    userId: user.id,
    jobId: id,
    currentVersion: job.evidence_map_version ?? null,
    values: {
      evidence_map: evidenceMap,
      gap_clarifications: updatedClarifications,
      gaps_addressed: updatedAddressed,
    },
  })

  if (update.error) {
    if (insertedEvidenceId) {
      await deleteInsertedEvidence(supabase, user.id, insertedEvidenceId)
    }
    return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
  }
  if (update.conflict) {
    if (insertedEvidenceId) {
      await deleteInsertedEvidence(supabase, user.id, insertedEvidenceId)
    }
    return buildConflictResponse(supabase, user.id, id)
  }

  if (body.requirementId && insertedEvidenceId) {
    await upsertProveFitDecision(supabase, {
      userId: user.id,
      jobId: id,
      requirementId: body.requirementId,
      requirementText: gap,
      decision: "confirmed",
      evidenceId: insertedEvidenceId,
      claimText: answer,
    })
  }

  await emitCoachEvent(supabase, user.id, id, "answered", { gap, requirement_id: body.requirementId ?? null })
  return NextResponse.json({
    success: true,
    evidenceId: insertedEvidenceId,
    evidenceMapVersion: update.nextVersion,
    coachStep: getCoachStepState({
      ...provisionalJob,
      evidence_map: evidenceMap,
    }),
  })
}
