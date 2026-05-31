import { NextResponse } from "next/server"
import type { createClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"
import { handleDomainEvent } from "@/lib/domain-events"
import { buildCapabilityPacket } from "@/lib/evidence/buildEvidenceMapForJob"
import { isMatchingComplete } from "@/lib/evidence/proofCoverage"
import type {
  CanonicalJobEvidenceMap,
  EvidenceCoverageSummary,
  RequirementEvidenceMatch,
} from "@/lib/evidence/types"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function buildConflictResponse(
  supabase: Supabase,
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

export function asCanonicalEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const map = value as CanonicalJobEvidenceMap
  return Array.isArray(map.requirement_matches) ? map : null
}

export function buildCoverageSummary(matches: RequirementEvidenceMatch[]): EvidenceCoverageSummary {
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

export function withUpdatedRequirementMatches(
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
    matching_complete: isMatchingComplete(requirementMatches),
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

export async function guardedCoachStepUpdate({
  supabase,
  userId,
  jobId,
  currentVersion,
  values,
}: {
  supabase: Supabase
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

export async function loadEvidenceRows(
  supabase: Supabase,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const { data } = await supabase
    .from("evidence_library")
    .select("id, source_title, source_type, role_name, company_name, responsibilities, tools_used, systems_used, workflows_created, outcomes, industries, proof_snippet, coached_version, provenance, first_confirmed_job_id, coach_tags, confidence_level, is_user_approved, visibility_status, is_active, what_not_to_overstate")
    .eq("user_id", userId)
    .eq("is_active", true)

  return (data ?? []) as Record<string, unknown>[]
}

export async function deleteInsertedEvidence(
  supabase: Supabase,
  userId: string,
  evidenceId: string,
): Promise<void> {
  await supabase
    .from("evidence_library")
    .delete()
    .eq("id", evidenceId)
    .eq("user_id", userId)
    .then(() => undefined, () => undefined)
}

export async function upsertProveFitDecision(
  supabase: Supabase,
  input: {
    userId: string
    jobId: string
    requirementId: string
    requirementText: string
    decision: "confirmed" | "skipped"
    evidenceId?: string | null
    sessionId?: string | null
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
      session_id: input.sessionId ?? null,
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
        session_id: input.sessionId ?? null,
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

export function emitCoachEvent(
  supabase: Supabase,
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
