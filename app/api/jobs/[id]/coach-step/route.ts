import { type NextRequest, NextResponse } from "next/server"

import { cleanGapLabel, getCoachStepState, withCoachStepMeta } from "@/lib/coach-step"
import { handleDomainEvent } from "@/lib/domain-events"
import { createClient } from "@/lib/supabase/server"

type CoachStepBody =
  | { action: "answer"; gap: string; requirementId?: string; answer: string }
  | { action: "skip" }
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
    .select("id,evidence_map,score,score_gaps,gap_clarifications,gaps_addressed")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (error || !job) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 })
  }

  if (body.action === "skip") {
    const update = await supabase
      .from("jobs")
      .update({
        evidence_map: withCoachStepMeta(job.evidence_map, "skipped", {
          skipped_at: new Date().toISOString(),
        }),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (update.error) {
      return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
    }

    await emitCoachEvent(supabase, user.id, id, "skipped", {})
    return NextResponse.json({ success: true, coachStep: { status: "skipped" } })
  }

  if (body.action === "complete") {
    const update = await supabase
      .from("jobs")
      .update({
        evidence_map: withCoachStepMeta(job.evidence_map, "completed", {
          completed_at: new Date().toISOString(),
        }),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (update.error) {
      return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
    }

    await emitCoachEvent(supabase, user.id, id, "completed", {})
    return NextResponse.json({ success: true, coachStep: { status: "completed" } })
  }

  if (body.action !== "answer") {
    return NextResponse.json({ success: false, error: "invalid_action" }, { status: 400 })
  }

  const gap = cleanGapLabel(body.gap ?? "")
  const answer = String(body.answer ?? "").trim()
  if (!gap || answer.length < 8) {
    return NextResponse.json(
      { success: false, error: "invalid_answer", user_message: "Add a little more detail before saving." },
      { status: 400 },
    )
  }

  const existingMap =
    job.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
      ? job.evidence_map as Record<string, unknown>
      : {}
  const canonicalMatches = Array.isArray(existingMap.requirement_matches)
    ? existingMap.requirement_matches as Array<Record<string, unknown>>
    : null
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
      question: `What real experience supports ${gap}?`,
      answer,
      routing: "coach_step",
      addressed_at: new Date().toISOString(),
    },
  ]

  const provisionalJob = {
    ...job,
    gap_clarifications: updatedClarifications,
    gaps_addressed: updatedAddressed,
    evidence_map: canonicalMatches
      ? {
          ...existingMap,
          requirement_matches: canonicalMatches.map((match) =>
            match.requirement_id === body.requirementId
              ? {
                  ...match,
                  reasoning: `${String(match.reasoning ?? "")} Coach clarification captured; await confirmed evidence before upgrading status.`.trim(),
                  updated_at: new Date().toISOString(),
                }
              : match,
          ),
        }
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

  const update = await supabase
    .from("jobs")
    .update({
      evidence_map: evidenceMap,
      gap_clarifications: updatedClarifications,
      gaps_addressed: updatedAddressed,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (update.error) {
    return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
  }

  await emitCoachEvent(supabase, user.id, id, "answered", { gap, requirement_id: body.requirementId ?? null })
  return NextResponse.json({
    success: true,
    coachStep: getCoachStepState({
      ...provisionalJob,
      evidence_map: evidenceMap,
    }),
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
