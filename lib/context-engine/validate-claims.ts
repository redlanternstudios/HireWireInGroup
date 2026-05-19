import type {
  AllowedUsage,
  ContextClaimVerdict,
  ContextEvidenceItem,
  ContextGapMatch,
  ContextGeneratedClaim,
} from "./types"
import { extractMetrics, nowIso, overlapScore, stableId, unique } from "./utils"

type ValidateClaimsInput = {
  userId?: string
  jobId?: string
  generatedDocumentId?: string | null
  claims: ContextGeneratedClaim[]
  evidenceItems: ContextEvidenceItem[]
  gapMatches?: ContextGapMatch[]
}

export function validateClaims(input: ValidateClaimsInput): ContextClaimVerdict[] {
  const evidenceById = new Map(input.evidenceItems.map((item) => [item.id, item]))
  const gapByRequirement = new Map((input.gapMatches ?? []).map((match) => [match.requirement_id, match]))
  const createdAt = nowIso()

  return input.claims.map((claim) => {
    const evidence = claim.evidence_ids.map((id) => evidenceById.get(id)).filter(Boolean) as ContextEvidenceItem[]
    const evidenceText = evidence.map((item) => `${item.raw_text} ${item.normalized_value}`).join(" ")
    const overlap = overlapScore(claim.claim_text, evidenceText)
    const claimMetrics = extractMetrics(claim.claim_text)
    const evidenceMetrics = extractMetrics(evidenceText)
    const unsupportedMetrics = claimMetrics.filter((metric) => !evidenceMetrics.some((evMetric) => evMetric.includes(metric) || metric.includes(evMetric)))
    const requirementRisks = (claim.requirement_ids ?? []).map((id) => gapByRequirement.get(id)?.risk_level).filter(Boolean)
    const hasBlockedRequirement = requirementRisks.includes("blocked")
    const hasEvidence = evidence.length > 0
    const tooPolished = /\b(spearheaded|visionary|world-class|best-in-class|thought leader|expert)\b/i.test(claim.claim_text)

    const riskFlags = unique([
      ...(!hasEvidence ? ["missing_evidence"] : []),
      ...(overlap < 0.12 ? ["low_evidence_overlap"] : []),
      ...(unsupportedMetrics.length > 0 ? ["untraceable_metric"] : []),
      ...(tooPolished ? ["polished_beyond_source"] : []),
      ...(hasBlockedRequirement ? ["blocked_requirement"] : []),
    ])
    const verdict = hasBlockedRequirement || !hasEvidence || unsupportedMetrics.length > 0
      ? "blocked"
      : overlap >= 0.28 && !tooPolished
        ? "supported"
        : overlap >= 0.12
          ? "supported_with_reframe"
          : "weak_support"
    const driftScore = Math.min(100, Math.round(
      (!hasEvidence ? 45 : 0) +
      (overlap < 0.12 ? 25 : overlap < 0.28 ? 12 : 0) +
      (unsupportedMetrics.length * 20) +
      (tooPolished ? 10 : 0) +
      (hasBlockedRequirement ? 40 : 0),
    ))

    return {
      id: stableId("ctx_claim", [input.userId, input.jobId, claim.claim_text, claim.evidence_ids.join(",")]),
      user_id: input.userId,
      job_id: input.jobId,
      generated_document_id: input.generatedDocumentId ?? null,
      claim_text: claim.claim_text,
      verdict,
      evidence_ids: claim.evidence_ids,
      drift_score: driftScore,
      risk_flags: riskFlags,
      suggested_rewrite: verdict === "supported" ? null : suggestRewrite(claim.claim_text, evidence[0]?.normalized_value),
      allowed_usage: usageFor(verdict),
      created_at: createdAt,
    }
  })
}

function usageFor(verdict: ContextClaimVerdict["verdict"]): AllowedUsage {
  if (verdict === "supported") return "resume_allowed"
  if (verdict === "supported_with_reframe") return "resume_allowed_with_reframe"
  if (verdict === "weak_support") return "interview_only"
  return "blocked"
}

function suggestRewrite(claim: string, evidence?: string) {
  if (!evidence) return "Remove this claim or add verified evidence before using it."
  return `Reframe more conservatively around verified evidence: ${evidence.slice(0, 180)}`
}
