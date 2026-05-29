import { type NextRequest, NextResponse } from "next/server"

import { getCoachStepState, withCoachStepMeta } from "@/lib/coach-step"
import { validateCoachAnswer } from "@/lib/coach/claim-validator"
import { buildConflictResponse, emitCoachEvent, guardedCoachStepUpdate } from "@/lib/coach/coach-step-helpers"
import { routeToolCall } from "@/lib/coach/tool-router"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/supabase/require-user"

type CoachStepBody =
  | { action: "answer"; gap: string; requirementId?: string; answer: string; force_save?: boolean }
  | { action: "skip"; gap?: string; requirementId?: string }
  | { action: "complete" }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = (await request.json()) as CoachStepBody
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id,evidence_map,evidence_map_version,score,score_gaps,gap_clarifications,gaps_addressed")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error || !job) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 })
  }

  if (body.action === "complete") {
    const update = await guardedCoachStepUpdate({
      supabase,
      userId,
      jobId: id,
      currentVersion: job.evidence_map_version ?? null,
      values: {
        evidence_map: withCoachStepMeta(job.evidence_map, "completed", {
          completed_at: new Date().toISOString(),
          compatibility_route: "coach-step",
        }),
      },
    })

    if (update.error) {
      return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 })
    }
    if (update.conflict) {
      return buildConflictResponse(supabase, userId, id)
    }

    await emitCoachEvent(supabase, userId, id, "completed", {
      compatibility_route: "coach-step",
    })

    return NextResponse.json({
      success: true,
      coachStep: { status: "completed" },
      evidenceMapVersion: update.nextVersion,
    })
  }

  if (body.action === "skip") {
    if (!body.requirementId) {
      return NextResponse.json(
        {
          success: false,
          error: "requirement_id_required",
          user_message: "Skipping requires a specific job requirement.",
        },
        { status: 400 },
      )
    }

    const output = await routeToolCall({
      sessionId: `coach-step:${id}:${body.requirementId}`,
      jobId: id,
      toolName: "skipRequirement",
      args: {
        job_id: id,
        requirement_id: body.requirementId,
        skip_reason: "User chose to skip this claim in the Match Interview.",
      },
      confirmed: true,
      conversationTurnNumber: 0,
    })

    if (!output.success) {
      return NextResponse.json(
        { success: false, error: output.result.error ?? "skip_failed" },
        { status: output.result.error?.startsWith("Conflict") ? 409 : 500 },
      )
    }

    const snapshot = await loadCoachStepSnapshot(supabase, userId, id)
    return NextResponse.json({
      success: true,
      coachStep: snapshot.coachStep,
      evidenceMapVersion: snapshot.evidenceMapVersion,
    })
  }

  if (body.action !== "answer") {
    return NextResponse.json({ success: false, error: "invalid_action" }, { status: 400 })
  }

  if (!body.requirementId) {
    return NextResponse.json(
      {
        success: false,
        error: "requirement_id_required",
        user_message: "Saving proof requires a specific job requirement.",
      },
      { status: 400 },
    )
  }

  const answer = String(body.answer ?? "").trim()
  const gap = String(body.gap ?? "").trim()
  const forceSave = !!body.force_save

  if (!gap || answer.length < 8) {
    return NextResponse.json(
      { success: false, error: "invalid_answer", user_message: "Add a little more detail before saving." },
      { status: 400 },
    )
  }

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

  const output = await routeToolCall({
    sessionId: `coach-step:${id}:${body.requirementId}`,
    jobId: id,
    toolName: "confirmProof",
    args: {
      job_id: id,
      requirement_id: body.requirementId,
      claim_text: answer,
    },
    confirmed: true,
    conversationTurnNumber: 0,
  })

  if (!output.success) {
    return NextResponse.json(
      { success: false, error: output.result.error ?? "confirm_failed" },
      { status: output.result.error?.startsWith("Conflict") ? 409 : 500 },
    )
  }

  const snapshot = await loadCoachStepSnapshot(supabase, userId, id)
  const data =
    output.result.data && typeof output.result.data === "object" && !Array.isArray(output.result.data)
      ? output.result.data as Record<string, unknown>
      : {}

  return NextResponse.json({
    success: true,
    evidenceId: data.evidence_id ?? null,
    evidenceMapVersion: snapshot.evidenceMapVersion,
    coachStep: snapshot.coachStep,
  })
}

async function loadCoachStepSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  jobId: string,
) {
  const { data: job } = await supabase
    .from("jobs")
    .select("evidence_map,evidence_map_version,score,score_gaps,gap_clarifications,gaps_addressed")
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  return {
    evidenceMapVersion: job?.evidence_map_version ?? null,
    coachStep: getCoachStepState(job ?? {}),
  }
}
