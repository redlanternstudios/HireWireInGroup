import type {
  CanonicalJobEvidenceMap,
  EvidenceIntelligencePacket,
  RequirementEvidenceMatch,
} from "@/lib/evidence/types"
import { requirementAnchorId } from "@/lib/coach/requirement-type"

type ProveFitDecisionAuthority =
  | string
  | { requirement_id?: unknown; decision?: unknown }

type EvidenceMapCarrier = {
  evidence_map?: unknown
  prove_fit_decision_requirement_ids?: unknown
  prove_fit_decisions?: ProveFitDecisionAuthority[] | null
}

export type UnresolvedRequirement = {
  id: string
  text: string
  status: string
  priority: RequirementEvidenceMatch["priority"]
  requirement_id: string
  requirement_text: string
  matched_evidence_ids: string[]
  proof_needed: string[]
  evidence_questions: string[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function asEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  const carrier = asRecord(value)
  const candidate = carrier && "evidence_map" in carrier
    ? carrier.evidence_map
    : value
  const map = asRecord(candidate)

  return Array.isArray(map?.requirement_matches)
    ? map as CanonicalJobEvidenceMap
    : null
}

function packetsForResume(packets: EvidenceIntelligencePacket[]): EvidenceIntelligencePacket[] {
  return packets.filter(packet =>
    packet.matchStrength !== "weak" &&
    packet.matchedEvidenceIds.length > 0 &&
    (packet.allowedUsage === "resume_allowed" || packet.allowedUsage === "resume_allowed_with_reframe")
  )
}

function getDecisionAuthorityRequirementIds(value: unknown): Set<string> {
  const carrier = asRecord(value)
  const ids = new Set<string>()

  const add = (requirementId: unknown) => {
    if (typeof requirementId !== "string") return
    const trimmed = requirementId.trim()
    if (trimmed) ids.add(trimmed)
  }

  const explicitIds = carrier?.prove_fit_decision_requirement_ids
  if (Array.isArray(explicitIds)) {
    explicitIds.forEach(add)
  }

  const decisions = carrier?.prove_fit_decisions
  if (Array.isArray(decisions)) {
    decisions.forEach((decision) => {
      if (typeof decision === "string") {
        add(decision)
        return
      }

      const row = asRecord(decision)
      if (row?.decision === "confirmed") {
        add(row.requirement_id)
      }
    })
  }

  return ids
}

function hasUsablePacket(
  match: RequirementEvidenceMatch,
  evidenceMap: CanonicalJobEvidenceMap,
): boolean {
  const packets = Array.isArray(evidenceMap.capability_packets)
    ? evidenceMap.capability_packets
    : []
  const usableRequirementIds = new Set(
    packetsForResume(packets).map((packet) =>
      String(packet.packet_id).replace(/^pkt_/, ""),
    ),
  )

  return usableRequirementIds.has(match.requirement_id)
}

export function isRequirementResolved(
  match: RequirementEvidenceMatch,
  evidenceMap: CanonicalJobEvidenceMap,
  confirmedAuthorityRequirementIds: Set<string>,
): boolean {
  if (match.proof_decision === "skipped") return true
  if (match.proof_decision === "auto_mapped") return true
  if (
    match.proof_decision === "confirmed" &&
    confirmedAuthorityRequirementIds.has(match.requirement_id)
  ) {
    return true
  }
  if (match.proof_decision === "confirmed") return false

  if (match.status === "gap" || match.status === "unknown" || match.status === "partial") {
    return false
  }

  return hasUsablePacket(match, evidenceMap)
}

export function listUnresolvedRequirements(
  jobOrEvidenceMap: EvidenceMapCarrier | CanonicalJobEvidenceMap | unknown,
): UnresolvedRequirement[] {
  const evidenceMap = asEvidenceMap(jobOrEvidenceMap)
  if (!evidenceMap) return []

  const confirmedAuthorityRequirementIds = getDecisionAuthorityRequirementIds(jobOrEvidenceMap)

  return evidenceMap.requirement_matches
    .filter((match) =>
      typeof match.requirement_id === "string" &&
      match.requirement_id.trim().length > 0 &&
      !isRequirementResolved(match, evidenceMap, confirmedAuthorityRequirementIds)
    )
    .sort((a, b) => {
      const rank = { required: 0, preferred: 1, keyword: 2 }
      return rank[a.priority] - rank[b.priority]
    })
    .map((match) => ({
      id: match.requirement_id,
      text: match.requirement_text,
      status: match.status,
      priority: match.priority,
      requirement_id: match.requirement_id,
      requirement_text: match.requirement_text,
      matched_evidence_ids: Array.isArray(match.matched_evidence_ids)
        ? match.matched_evidence_ids
        : [],
      proof_needed: Array.isArray(match.proof_needed) ? match.proof_needed : [],
      evidence_questions: Array.isArray(match.evidence_questions) ? match.evidence_questions : [],
    }))
}

export function getFirstUnresolvedRequirementId(
  jobOrEvidenceMap: EvidenceMapCarrier | CanonicalJobEvidenceMap | unknown,
): string | null {
  return listUnresolvedRequirements(jobOrEvidenceMap)[0]?.id ?? null
}

export function buildEvidenceFixHref(jobId: string | null | undefined, requirementId: string | null | undefined): string {
  if (!jobId) return "/evidence"
  if (!requirementId) return `/jobs/${jobId}/evidence-match`

  return `/jobs/${jobId}/evidence-match?req=${encodeURIComponent(requirementId)}#${requirementAnchorId(requirementId)}`
}
