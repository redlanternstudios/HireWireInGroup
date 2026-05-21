import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CanonicalJobEvidenceMap,
  EvidenceCoverageSummary,
  RequirementEvidenceMatch,
} from "./types"
import { buildCapabilityPacket } from "./buildEvidenceMapForJob"

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

function asEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const map = value as CanonicalJobEvidenceMap
  return Array.isArray(map.requirement_matches) ? map : null
}

function buildCoverageSummary(matches: RequirementEvidenceMatch[]): EvidenceCoverageSummary {
  return {
    required_total: matches.filter(m => m.priority === "required").length,
    required_met: matches.filter(m => m.priority === "required" && m.status === "met").length,
    required_partial: matches.filter(m => m.priority === "required" && m.status === "partial").length,
    required_gaps: matches.filter(m => m.priority === "required" && (m.status === "gap" || m.status === "unknown")).length,
    preferred_total: matches.filter(m => m.priority === "preferred").length,
    preferred_met: matches.filter(m => m.priority === "preferred" && m.status === "met").length,
    keyword_total: matches.filter(m => m.priority === "keyword").length,
    keyword_met: matches.filter(m => m.priority === "keyword" && m.status === "met").length,
  }
}

function mergeEvidence(match: RequirementEvidenceMatch, params: MapConfirmedEvidenceParams): RequirementEvidenceMatch {
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

  return {
    ...match,
    status: match.status === "met" ? "met" : "partial",
    matched_evidence_ids,
    matched_evidence_titles,
    evidence_types,
    confidence: match.confidence === "high" ? "high" : "medium",
    match_method: "manual",
    reasoning: "User-confirmed evidence was mapped to this requirement through a coach session.",
    riskFlags: (match.riskFlags ?? []).filter(flag => flag !== "missing_evidence" && flag !== "no_packet_evidence"),
    mapped_by_session_ids,
    updated_at: new Date().toISOString(),
  }
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
}: MapConfirmedEvidenceParams): Promise<CanonicalJobEvidenceMap> {
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

  const requirement_matches = currentMap.requirement_matches.map(match =>
    match.requirement_id === requirementId
      ? mergeEvidence(match, { supabase, userId, jobId, sessionId, requirementId, evidenceId, evidenceTitle, evidenceType })
      : match
  )
  const evidenceCandidates = await supabase
    .from("evidence_library")
    .select("id, source_title, source_type, role_name, company_name, responsibilities, tools_used, outcomes, industries, proof_snippet, confidence_level, is_user_approved, visibility_status, is_active, what_not_to_overstate")
    .eq("user_id", userId)
    .eq("is_active", true)

  const evidenceRows = (evidenceCandidates.data ?? []) as Record<string, unknown>[]
  const nextMap: CanonicalJobEvidenceMap = {
    ...currentMap,
    version: crypto.randomUUID(),
    completed_at: new Date().toISOString(),
    matching_complete: true,
    requirement_matches,
    capability_packets: requirement_matches.map(match => buildCapabilityPacket(match, evidenceRows)),
    coverage_summary: buildCoverageSummary(requirement_matches),
    gap_summary: requirement_matches
      .filter(match => match.status === "gap" || match.status === "unknown")
      .map(match => match.requirement_text),
  }

  const write = supabase
    .from("jobs")
    .update({
      evidence_map: nextMap,
      evidence_map_version: nextMap.version,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", userId)

  const guardedWrite = job.evidence_map_version
    ? write.eq("evidence_map_version", job.evidence_map_version)
    : write.is("evidence_map_version", null)

  const { data: writtenRows, error: writeError } = await guardedWrite.select("id")
  if (writeError) throw writeError
  if (!writtenRows || writtenRows.length === 0) throw new Error("evidence_map_conflict")

  return nextMap
}
