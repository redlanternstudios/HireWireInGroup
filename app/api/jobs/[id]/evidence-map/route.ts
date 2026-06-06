import { type NextRequest, NextResponse } from "next/server"
import { handleDomainEvent } from "@/lib/domain-events"
import { deriveMatchingComplete } from "@/lib/evidence/proofCoverage"
import {
  buildEvidenceFixHref,
  listUnresolvedRequirements,
} from "@/lib/evidence/unresolved-requirements"
import { mapConfirmedEvidenceToRequirement } from "@/lib/evidence/mapConfirmedEvidenceToRequirement"
import { requireUser } from "@/lib/supabase/require-user"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth
  const { id: jobId } = await params

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, evidence_map")
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: "evidence_map_read_failed" },
      { status: 500 },
    )
  }

  if (!job) {
    return NextResponse.json(
      { success: false, error: "job_not_found" },
      { status: 404 },
    )
  }

  const coverage = await deriveMatchingComplete({
    supabase,
    userId,
    jobId,
    evidenceMap: job.evidence_map,
  })
  const evidenceMap = {
    ...(job.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
      ? job.evidence_map as Record<string, unknown>
      : {}),
    requirement_matches: coverage.requirementMatches,
    matching_complete: coverage.matchingComplete,
  }
  const blockedRequirements = listUnresolvedRequirements({
    evidence_map: evidenceMap,
    prove_fit_decision_requirement_ids: coverage.confirmedDecisionRequirementIds,
  }).map((requirement) => ({
    id: requirement.id,
    text: requirement.text,
    status: requirement.status,
    priority: requirement.priority,
  }))
  const firstUnresolvedRequirementId = blockedRequirements[0]?.id ?? null

  return NextResponse.json({
    success: true,
    matching_complete: coverage.matchingComplete && blockedRequirements.length === 0,
    blocked_requirements: blockedRequirements,
    first_unresolved_requirement_id: firstUnresolvedRequirementId,
    next_action: firstUnresolvedRequirementId
      ? {
          label: "Prove Fit",
          href: buildEvidenceFixHref(jobId, firstUnresolvedRequirementId),
          description: "Confirm or skip the claims HireWire cannot verify yet.",
        }
      : null,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth
    const { id: jobId } = await params
    const body = await request.json()
    const requirementId = String(body.requirementId ?? "").trim()
    const evidenceId = String(body.evidenceId ?? "").trim()

    if (!requirementId || !evidenceId) {
      return NextResponse.json(
        { success: false, error: "missing_fields", user_message: "Choose a requirement and evidence item." },
        { status: 400 }
      )
    }

    const [{ data: job }, { data: evidence }] = await Promise.all([
      supabase
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("evidence_library")
        .select("id, source_title, source_type")
        .eq("id", evidenceId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
    ])

    if (!job) {
      return NextResponse.json({ success: false, error: "job_not_found" }, { status: 404 })
    }
    if (!evidence) {
      return NextResponse.json({ success: false, error: "evidence_not_found" }, { status: 404 })
    }

    const mappingResult = await mapConfirmedEvidenceToRequirement({
      supabase,
      userId,
      jobId,
      sessionId: "evidence-match-ui",
      requirementId,
      evidenceId,
      evidenceTitle: evidence.source_title,
      evidenceType: evidence.source_type,
    })

    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: jobId,
      user_id: userId,
      source: "evidence_action",
      payload: {
        requirement_id: requirementId,
        evidence_id: evidenceId,
        prev_status: mappingResult.prevStatus,
        new_status: mappingResult.newStatus,
        source_title: evidence.source_title,
        source_type: evidence.source_type,
        via: "evidence_match_ui",
      },
    })

    return NextResponse.json({
      success: true,
      requirementId,
      evidenceId,
      prevStatus: mappingResult.prevStatus,
      newStatus: mappingResult.newStatus,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to map evidence"
    const status = message === "evidence_map_conflict" ? 409 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
