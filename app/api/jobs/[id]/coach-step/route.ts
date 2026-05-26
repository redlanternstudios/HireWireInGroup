import { type NextRequest, NextResponse } from "next/server"

import { cleanGapLabel, getCoachStepState, withCoachStepMeta } from "@/lib/coach-step"
import { logAuditEvent } from "@/lib/audit"
import { handleDomainEvent } from "@/lib/domain-events"
import { buildCapabilityPacket } from "@/lib/evidence/buildEvidenceMapForJob"
import { validateCoachAnswer } from "@/lib/coach/claim-validator"
import type {
  CanonicalJobEvidenceMap,
  EvidenceCoverageSummary,
  RequirementEvidenceMatch,
} from "@/lib/evidence/types"
import { createClient } from "@/lib/supabase/server"

type CoachStepBody =
  | { action: "answer"; gap: string; requirementId?: string; answer: string; force_save?: boolean }
  | { action: "skip"; gap?: string; requirementId?: string }
  | { action: "complete" }

function asCanonicalEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const map = value as CanonicalJobEvidenceMap
  return Array.isArray(map.requirement_matches) ? map : null
}

function buildCoverageSummary(matches: RequirementEvidenceMatch[]): EvidenceCoverageSummary {
  return {
    required_total: matches.filter((match) => match.priority === "required").length,
    required_met: matches.filter((match) => match.priority === "required" && match.status === "met").length,
    required_partial: matches.filter((match) => match.priority === "required" && match.status === "partial").length,
    required_gaps: matches.filter(
      (match) =>
        match.priority === "required" &&
        match.proof_decision !== "skipped" &&
        (match.status === "gap" || match.status === "unknown"),
    ).length,
    preferred_total: matches.filter((match) => match.priority === "preferred").length,
    preferred_met: matches.filter((match) => match.priority === "preferred" && match.status === "met").length,
    keyword_total: matches.filter((match) => match.priority === "keyword").length,
    keyword_met: matches.filter((match) => match.priority === "keyword" && match.status === "met").length,
  }
}

function withUpdatedRequirementMatches(
  evidenceMap: unknown,
  requirementMatches: RequirementEvidenceMatch[],
  evidenceRows: Record<string, unknown>[] = [],
) {
  const existingMap =
    evidenceMap && typeof evidenceMap === "object" && !Array.isArray(evidenceMap)
      ? evidenceMap as Record<string, unknown>
      : {}

  return {
    ...existingMap,
    matching_complete: true,
    completed_at: new Date().toISOString(),
    version: crypto.randomUUID(),
    requirement_matches: requirementMatches,
    capability_packets: requirementMatches.map((match) => buildCapabilityPacket(match, evidenceRows)),
    coverage_summary: buildCoverageSummary(requirementMatches),
    gap_summary: requirementMatches
      .filter((match) => match.proof_decision !== "skipped" && (match.status === "gap" || match.status === "unknown"))
      .map((match) => match.requirement_text),
  }
}

async function buildConflictResponse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  jobId: string,
) {
  const { data: latest } = await supabase
    .from("jobs")
    .select("evidence_map_version")
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  return NextResponse.json(
    {
      success: false,
      error: "evidence_map_conflict",
      currentVersion: latest?.evidence_map_version ?? null,
      user_message:
        "This job was updated in another tab. Refresh and try again so you don't overwrite newer coach updates.",
    },
    { status: 409 },
  )
}

async function guardedCoachStepUpdate({
  supabase,
  userId,
  jobId,
  currentVersion,
  values,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  jobId: string
  currentVersion: string | null
  values: Record<string, unknown>
}) {
  const nextVersion = crypto.randomUUID()
  const update = supabase
    .from("jobs")
    .update({
      ...values,
      evidence_map_version: nextVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)

  const guardedUpdate = currentVersion
    ? update.eq("evidence_map_version", currentVersion)
    : update.is("evidence_map_version", null)

  const { data, error } = await guardedUpdate.select("id")
  if (error) {
    return { ok: false as const, error: true as const, conflict: false as const }
  }
  if (!data || data.length === 0) {
    return { ok: false as const, error: false as const, conflict: true as const }
  }

  return {
    ok: true as const,
    error: false as const,
    conflict: false as const,
    nextVersion,
  }
}

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

async function loadEvidenceRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("evidence_library")
    .select("id, source_title, source_type, role_name, company_name, responsibilities, tools_used, systems_used, workflows_created, outcomes, industries, proof_snippet, confidence_level, is_user_approved, visibility_status, is_active, what_not_to_overstate")
    .eq("user_id", userId)
    .eq("is_active", true)

  return (data ?? []) as Record<string, unknown>[]
}

async function deleteInsertedEvidence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  evidenceId: string,
) {
  await supabase
    .from("evidence_library")
    .delete()
    .eq("id", evidenceId)
    .eq("user_id", userId)
    .then(() => undefined, () => undefined)
}

async function upsertProveFitDecision(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    userId: string
    jobId: string
    requirementId: string
    requirementText: string
    decision: "confirmed" | "skipped"
    evidenceId?: string | null
    claimText?: string | null
    skipReason?: string | null
  },
) {
  const auditEventType = input.decision === "confirmed" ? "prove_fit_confirmed" : "prove_fit_skipped"
  const { error } = await supabase
    .from("prove_fit_decisions")
    .upsert({
      user_id: input.userId,
      job_id: input.jobId,
      requirement_id: input.requirementId,
      requirement_text: input.requirementText,
      decision: input.decision,
      evidence_id: input.evidenceId ?? null,
      claim_text: input.claimText ?? null,
      skip_reason: input.skipReason ?? null,
      source: "match_interview",
      input_summary: input.claimText ? input.claimText.slice(0, 500) : input.skipReason ?? null,
      system_summary: input.decision === "confirmed"
        ? "User-confirmed claim saved as approved user_input proof and mapped to the requirement."
        : "Requirement explicitly skipped; downstream generation must not make this claim.",
      impact: {
        readiness: "recomputed",
        generation_eligibility: "re-evaluated",
        output_rule: input.decision === "confirmed"
          ? "claim may be used within confirmed scope"
          : "claim must not be made",
      },
      after_state: {
        decision: input.decision,
        evidence_id: input.evidenceId ?? null,
      },
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,job_id,requirement_id,decision",
    })

  if (error) {
    console.error("[HireWire] prove_fit_decision_upsert_failed", {
      action: "upsert_prove_fit_decision",
      user_id: input.userId,
      job_id: input.jobId,
      requirement_id: input.requirementId,
      decision: input.decision,
      message: error.message,
      code: error.code,
    })
  }

  await logAuditEvent({
    user_id: input.userId,
    job_id: input.jobId,
    event_type: auditEventType,
    outcome: "success",
    reason: input.decision === "confirmed"
      ? "User confirmed a Match Interview claim."
      : "User skipped a Match Interview claim.",
    metadata: {
      requirement_id: input.requirementId,
      requirement_text: input.requirementText,
      evidence_id: input.evidenceId ?? null,
      claim_summary: input.claimText ? input.claimText.slice(0, 240) : null,
      skip_reason: input.skipReason ?? null,
      impact: {
        readiness: "recomputed",
        generation_eligibility: "re-evaluated",
        output_rule: input.decision === "confirmed"
          ? "claim may be used within confirmed scope"
          : "claim must not be made",
      },
    },
  })

  await handleDomainEvent({
    supabase,
    event_type: "prove_fit_decision_recorded",
    job_id: input.jobId,
    user_id: input.userId,
    source: "coach_route",
    payload: {
      requirement_id: input.requirementId,
      requirement_text: input.requirementText,
      decision: input.decision,
      evidence_id: input.evidenceId ?? null,
      has_claim_text: !!input.claimText,
    },
  })
}

function emitCoachEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  jobId: string,
  action: string,
  payload: Record<string, unknown>,
) {
  return handleDomainEvent({
    supabase,
    event_type: "coach_action_taken",
    job_id: jobId,
    user_id: userId,
    source: "coach_route",
    payload: {
      action,
      ...payload,
    },
  })
}
