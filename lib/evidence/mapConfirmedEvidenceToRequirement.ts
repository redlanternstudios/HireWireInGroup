import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CanonicalJobEvidenceMap,
  RequirementEvidenceMatch,
} from "./types"
import { buildEvidenceMapForJob } from "./buildEvidenceMapForJob"
import { getEvidenceUsageRule } from "@/lib/truthserum"

type MapConfirmedEvidenceParams = {
  supabase: SupabaseClient
  userId: string
  jobId: string
  sessionId: string
  requirementId: string
  evidenceId: string
  evidenceTitle?: string | null
  evidenceType?: string | null
}

export type MapConfirmedEvidenceResult = {
  evidenceMap: CanonicalJobEvidenceMap
  requirementId: string
  prevStatus: RequirementEvidenceMatch["status"]
  newStatus: RequirementEvidenceMatch["status"]
}

function asEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const map = value as CanonicalJobEvidenceMap
  return Array.isArray(map.requirement_matches) ? map : null
}

function isUsableConfirmedEvidence(evidence: Record<string, unknown> | undefined): boolean {
  if (!evidence) return false
  const coached = typeof evidence.coached_version === "string" ? evidence.coached_version.trim() : ""
  const snippet = typeof evidence.proof_snippet === "string" ? evidence.proof_snippet.trim() : ""
  const confidence = typeof evidence.confidence_level === "string" ? evidence.confidence_level.toLowerCase() : ""
  const active = evidence.is_active !== false
  const usage = getEvidenceUsageRule(evidence as never)

  return (
    active &&
    (coached || snippet).length >= 40 &&
    confidence !== "low" &&
    usage !== "blocked" &&
    usage !== "interview_only"
  )
}

function mergeEvidence(
  match: RequirementEvidenceMatch,
  params: MapConfirmedEvidenceParams,
  evidence: Record<string, unknown> | undefined
): RequirementEvidenceMatch {
  const matched_evidence_ids = Array.from(new Set([...match.matched_evidence_ids, params.evidenceId]))
  const matched_evidence_titles = Array.from(new Set([
    ...match.matched_evidence_titles,
    ...(params.evidenceTitle ? [params.evidenceTitle] : []),
  ]))
  const evidence_types = Array.from(new Set([
    ...match.evidence_types,
    ...(params.evidenceType ? [params.evidenceType] : []),
  ]))
  const mapped_by_session_ids = Array.from(new Set([
    ...(match.mapped_by_session_ids ?? []),
    params.sessionId,
  ]))
  const nextStatus =
    match.status === "met" ? "met" :
    isUsableConfirmedEvidence(evidence) ? "met" :
    "partial"

  return {
    ...match,
    status: nextStatus,
    matched_evidence_ids,
    matched_evidence_titles,
    evidence_types,
    confidence: nextStatus === "met" ? "high" : match.confidence === "high" ? "high" : "medium",
    match_method: "manual",
    reasoning: nextStatus === "met"
      ? "User-confirmed, usable evidence was mapped to this requirement through a coach session."
      : "User-confirmed evidence was mapped to this requirement, but proof strength still needs review.",
    riskFlags: (match.riskFlags ?? []).filter(flag =>
      nextStatus === "met"
        ? flag !== "missing_evidence" && flag !== "no_packet_evidence" && flag !== "partial_match"
        : flag !== "missing_evidence" && flag !== "no_packet_evidence"
    ),
    proof_decision: "confirmed",
    user_claim: typeof evidence?.coached_version === "string"
      ? evidence.coached_version
      : typeof evidence?.proof_snippet === "string"
        ? evidence.proof_snippet
        : match.user_claim ?? null,
    skip_reason: null,
    confirmed_at: new Date().toISOString(),
    skipped_at: null,
    mapped_by_session_ids,
    updated_at: new Date().toISOString(),
  }
}

async function recordConfirmedDecision({
  supabase,
  userId,
  jobId,
  sessionId,
  requirementId,
  requirementText,
  evidenceId,
  claimText,
}: {
  supabase: SupabaseClient
  userId: string
  jobId: string
  sessionId: string
  requirementId: string
  requirementText: string
  evidenceId: string
  claimText?: string | null
}) {
  const { error } = await supabase
    .from("prove_fit_decisions")
    .upsert({
      user_id: userId,
      job_id: jobId,
      requirement_id: requirementId,
      requirement_text: requirementText,
      decision: "confirmed",
      evidence_id: evidenceId,
      claim_text: claimText ?? null,
      session_id: sessionId,
      source: "match_interview",
      input_summary: claimText ? claimText.slice(0, 500) : null,
      system_summary: "User-confirmed evidence was mapped to this requirement.",
      impact: {
        readiness: "recomputed",
        generation_eligibility: "re-evaluated",
        output_rule: "claim may be used within confirmed scope",
      },
      after_state: {
        decision: "confirmed",
        evidence_id: evidenceId,
      },
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,job_id,requirement_id,decision",
    })

  if (error) throw error
}

export async function mapConfirmedEvidenceToRequirement({
  supabase,
  userId,
  jobId,
  sessionId,
  requirementId,
  evidenceId,
  evidenceTitle,
  evidenceType,
}: MapConfirmedEvidenceParams): Promise<MapConfirmedEvidenceResult> {
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id,evidence_map,evidence_map_version")
    .eq("id", jobId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (jobError || !job) throw new Error("job_not_found")

  const currentMap = asEvidenceMap(job.evidence_map)
  if (!currentMap) throw new Error("canonical_evidence_map_missing")

  const targetExists = currentMap.requirement_matches.some(match => match.requirement_id === requirementId)
  if (!targetExists) throw new Error("requirement_not_found")

  const evidenceCandidates = await supabase
    .from("evidence_library")
    .select("id, source_title, source_type, role_name, company_name, responsibilities, tools_used, outcomes, industries, proof_snippet, coached_version, provenance, first_confirmed_job_id, coach_tags, confidence_level, is_user_approved, visibility_status, is_active, what_not_to_overstate")
    .eq("user_id", userId)
    .eq("is_active", true)

  const evidenceRows = (evidenceCandidates.data ?? []) as Record<string, unknown>[]
  const confirmedEvidence = evidenceRows.find(row => String(row.id) === evidenceId)
  const previousMatch = currentMap.requirement_matches.find(match => match.requirement_id === requirementId)
  if (!previousMatch) throw new Error("requirement_not_found")

  const requirement_matches = currentMap.requirement_matches.map(match =>
    match.requirement_id === requirementId
      ? mergeEvidence(match, { supabase, userId, jobId, sessionId, requirementId, evidenceId, evidenceTitle, evidenceType }, confirmedEvidence)
      : match
  )
  const updatedMatch = requirement_matches.find(match => match.requirement_id === requirementId)
  if (!updatedMatch) throw new Error("requirement_not_found")

  const userClaim = updatedMatch.user_claim ?? null
  const { error: evidenceUpdateError } = await supabase
    .from("evidence_library")
    .update({
      coached_version: userClaim,
      is_user_approved: true,
      provenance: "coach_session",
      first_confirmed_job_id: typeof confirmedEvidence?.first_confirmed_job_id === "string"
        ? confirmedEvidence.first_confirmed_job_id
        : jobId,
      coach_tags: updatedMatch.related_skills ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", evidenceId)
    .eq("user_id", userId)

  if (evidenceUpdateError) throw evidenceUpdateError

  await recordConfirmedDecision({
    supabase,
    userId,
    jobId,
    sessionId,
    requirementId,
    requirementText: updatedMatch.requirement_text,
    evidenceId,
    claimText: userClaim,
  })

  const nextMap = await buildEvidenceMapForJob({
    supabase,
    userId,
    jobId,
  })

  return {
    evidenceMap: nextMap,
    requirementId,
    prevStatus: previousMatch.status,
    newStatus: updatedMatch.status,
  }
}
