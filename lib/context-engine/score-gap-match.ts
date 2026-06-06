import type {
  AllowedUsage,
  ContextCapability,
  ContextEvidenceItem,
  ContextGapMatch,
  ContextGapReport,
  ContextNormalizedEntity,
  GapMatchType,
  JobRequirementModel,
  RiskLevel,
} from "./types"
import { nowIso, overlapScore, stableId, tokenize, unique } from "./utils"

type ScoreGapMatchInput = {
  userId?: string
  jobId?: string
  evidenceItems: ContextEvidenceItem[]
  entities: ContextNormalizedEntity[]
  capabilities: ContextCapability[]
  requirements: JobRequirementModel[]
}

export function scoreGapMatch(input: ScoreGapMatchInput): ContextGapReport {
  const matches = input.requirements.map((requirement) => matchRequirement(input, requirement))
  const score = Math.round(
    matches.reduce((sum, match) => sum + match.match_score, 0) / Math.max(matches.length, 1),
  )
  return {
    matches,
    score,
    directMatches: matches.filter((match) => match.match_type === "direct_match").length,
    adjacentMatches: matches.filter((match) => match.match_type === "adjacent_match").length,
    inferredMatches: matches.filter((match) => match.match_type === "inferred_match").length,
    trueGaps: matches.filter((match) => match.match_type === "true_gap").length,
    unsupported: matches.filter((match) => match.match_type === "unsupported").length,
  }
}

function matchRequirement(input: ScoreGapMatchInput, requirement: JobRequirementModel): ContextGapMatch {
  const createdAt = nowIso()
  const reqText = requirement.normalized_requirement || requirement.requirement_text
  const evidenceScores = input.evidenceItems.map((item) => ({
    item,
    score: Math.max(
      overlapScore(reqText, item.normalized_value),
      overlapScore(reqText, item.raw_text),
      containsTermScore(reqText, item.normalized_value),
    ),
  })).sort((a, b) => b.score - a.score)
  const entityScores = input.entities.map((entity) => ({
    entity,
    score: Math.max(
      overlapScore(reqText, entity.canonical_name),
      ...entity.aliases.map((alias) => overlapScore(reqText, alias)),
      containsTermScore(reqText, entity.canonical_name),
    ),
  })).sort((a, b) => b.score - a.score)
  const capabilityScores = input.capabilities.map((capability) => ({
    capability,
    score: Math.max(
      overlapScore(reqText, capability.capability_name),
      containsTermScore(reqText, capability.capability_name),
    ),
  })).sort((a, b) => b.score - a.score)

  const bestEvidence = evidenceScores[0]
  const bestEntity = entityScores[0]
  const bestCapability = capabilityScores[0]
  const directScore = Math.max(bestEvidence?.score ?? 0, bestEntity?.score ?? 0)
  const inferredScore = bestCapability?.score ?? 0
  const matchType = classifyMatch(directScore, inferredScore, requirement.importance)
  const evidenceIds = unique([
    ...(bestEvidence && bestEvidence.score >= 0.18 ? [bestEvidence.item.id] : []),
    ...(bestEntity && bestEntity.score >= 0.18 ? bestEntity.entity.evidence_ids : []),
    ...(bestCapability && bestCapability.score >= 0.16 ? bestCapability.capability.inferred_from_evidence_ids : []),
  ])
  const capabilityIds = bestCapability && bestCapability.score >= 0.16 ? [bestCapability.capability.id] : []
  const matchScore = scoreFor(matchType, directScore, inferredScore)
  const riskLevel = riskFor(matchType, requirement.importance, bestCapability?.capability.risk_level)
  const permissions = permissionsFor(matchType, riskLevel)

  return {
    id: stableId("ctx_gap", [input.userId, input.jobId, requirement.id, matchType, evidenceIds.join(",")]),
    user_id: input.userId,
    job_id: input.jobId,
    requirement_id: requirement.id,
    match_type: matchType,
    match_score: matchScore,
    evidence_ids: evidenceIds,
    capability_ids: capabilityIds,
    explanation: explain(matchType, reqText, evidenceIds.length, capabilityIds.length),
    resume_permission: permissions.resume,
    cover_letter_permission: permissions.coverLetter,
    interview_permission: permissions.interview,
    risk_level: riskLevel,
    created_at: createdAt,
  }
}

function classifyMatch(directScore: number, inferredScore: number, importance: string): GapMatchType {
  if (directScore >= 0.75) return "direct_match"
  if (directScore >= 0.45) return "terminology_mismatch"
  if (directScore >= 0.25) return "adjacent_match"
  if (inferredScore >= 0.25) return "inferred_match"
  if (importance === "critical" || importance === "high") return "true_gap"
  return "unsupported"
}

function scoreFor(matchType: GapMatchType, directScore: number, inferredScore: number) {
  const raw = matchType === "direct_match" ? 90 + directScore * 10
    : matchType === "terminology_mismatch" ? 70 + directScore * 15
    : matchType === "adjacent_match" ? 50 + directScore * 20
    : matchType === "inferred_match" ? 45 + inferredScore * 20
    : matchType === "unsupported" ? 20
    : 5
  return Math.min(100, Math.round(raw))
}

function riskFor(matchType: GapMatchType, importance: string, capabilityRisk?: RiskLevel): RiskLevel {
  if (matchType === "true_gap") return importance === "critical" ? "blocked" : "high"
  if (matchType === "unsupported") return "high"
  if (matchType === "inferred_match") return capabilityRisk === "low" ? "medium" : capabilityRisk ?? "medium"
  if (matchType === "adjacent_match") return "medium"
  return "low"
}

function permissionsFor(matchType: GapMatchType, riskLevel: RiskLevel): { resume: AllowedUsage; coverLetter: AllowedUsage; interview: AllowedUsage } {
  if (riskLevel === "blocked") return { resume: "blocked", coverLetter: "blocked", interview: "coach_only" }
  if (matchType === "direct_match" || matchType === "terminology_mismatch") {
    return { resume: "resume_allowed", coverLetter: "cover_letter_allowed", interview: "interview_only" }
  }
  if (matchType === "adjacent_match" || matchType === "inferred_match") {
    return { resume: "resume_allowed_with_reframe", coverLetter: "cover_letter_allowed", interview: "interview_only" }
  }
  return { resume: "blocked", coverLetter: "coach_only", interview: "interview_only" }
}

function explain(matchType: GapMatchType, requirement: string, evidenceCount: number, capabilityCount: number) {
  if (matchType === "direct_match") return `Direct evidence supports "${requirement}".`
  if (matchType === "terminology_mismatch") return `Evidence appears to cover "${requirement}" using different wording.`
  if (matchType === "adjacent_match") return `Adjacent evidence can support "${requirement}" with conservative framing.`
  if (matchType === "inferred_match") return `Capability inference supports "${requirement}" from ${capabilityCount} capability signal(s); use with caution.`
  if (matchType === "true_gap") return `No sufficient evidence supports "${requirement}".`
  return evidenceCount > 0 ? `Weak evidence exists for "${requirement}", but not enough for resume claims.` : `Unsupported requirement: "${requirement}".`
}

function containsTermScore(left: string, right: string) {
  const leftTokens = tokenize(left)
  const rightValue = right.toLowerCase()
  const hits = leftTokens.filter((token) => rightValue.includes(token)).length
  return hits / Math.max(leftTokens.length, 1)
}
