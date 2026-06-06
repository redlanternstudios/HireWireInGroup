import type {
  ContextCapability,
  ContextEvidenceItem,
  ContextGapMatch,
  ContextGeneratedClaim,
  ContextNormalizedEntity,
  ContextSource,
  EvidenceGraph,
  JobRequirementModel,
} from "./types"

export function buildEvidenceGraph(input: {
  sources?: ContextSource[]
  evidenceItems?: ContextEvidenceItem[]
  entities?: ContextNormalizedEntity[]
  capabilities?: ContextCapability[]
  requirements?: JobRequirementModel[]
  gapMatches?: ContextGapMatch[]
  claims?: ContextGeneratedClaim[]
}): EvidenceGraph {
  const sources = input.sources ?? []
  const evidenceItems = input.evidenceItems ?? []
  const entities = input.entities ?? []
  const capabilities = input.capabilities ?? []
  const requirements = input.requirements ?? []
  const gapMatches = input.gapMatches ?? []
  const claims = input.claims ?? []

  return {
    nodes: [
      ...sources.map((source) => ({ id: source.id, type: "source" as const, label: source.source_label })),
      ...evidenceItems.map((item) => ({ id: item.id, type: "evidence" as const, label: item.normalized_value, metadata: { evidence_type: item.evidence_type } })),
      ...entities.map((entity) => ({ id: entity.id, type: "entity" as const, label: entity.canonical_name, metadata: { category: entity.category } })),
      ...capabilities.map((capability) => ({ id: capability.id, type: "capability" as const, label: capability.capability_name, metadata: { allowed_usage: capability.allowed_usage } })),
      ...requirements.map((requirement) => ({ id: requirement.id, type: "requirement" as const, label: requirement.normalized_requirement, metadata: { importance: requirement.importance } })),
      ...claims.map((claim) => ({ id: claim.id, type: "claim" as const, label: claim.claim_text, metadata: { document_type: claim.document_type } })),
    ],
    edges: [
      ...evidenceItems.map((item) => ({ from: item.id, to: item.source_id, relationship: "extracted_from" as const, confidence: item.confidence })),
      ...entities.flatMap((entity) => entity.evidence_ids.map((evidenceId) => ({ from: evidenceId, to: entity.id, relationship: "normalizes_to" as const, confidence: entity.confidence }))),
      ...capabilities.flatMap((capability) => capability.inferred_from_evidence_ids.map((evidenceId) => ({ from: evidenceId, to: capability.id, relationship: "infers" as const, confidence: capability.confidence }))),
      ...gapMatches.flatMap((match) => [
        ...match.evidence_ids.map((evidenceId) => ({ from: evidenceId, to: match.requirement_id, relationship: "matches" as const, confidence: match.match_score >= 70 ? "high" as const : match.match_score >= 40 ? "medium" as const : "low" as const })),
        ...match.capability_ids.map((capabilityId) => ({ from: capabilityId, to: match.requirement_id, relationship: "matches" as const, confidence: "medium" as const })),
      ]),
      ...claims.flatMap((claim) => claim.evidence_ids.map((evidenceId) => ({ from: evidenceId, to: claim.id, relationship: "supports" as const, confidence: "medium" as const }))),
      ...claims.flatMap((claim) => (claim.requirement_ids ?? []).map((requirementId) => ({ from: requirementId, to: claim.id, relationship: "generates" as const, confidence: "medium" as const }))),
    ],
  }
}
