// Coach validation logic for claims, evidence, and quality gates
import { Claim, EvidenceItem, QualityGateResult } from "./types"
import { TRUTH_STATES, QUALITY_HARD_FAILS, QUALITY_WARNINGS } from "./constants"

export function validateClaim(claim: Claim): string[] {
  const errors: string[] = []
  if (claim.truth_state === "UNSUPPORTED") errors.push("unsupported claim")
  if (!claim.text || claim.text.trim().length === 0) errors.push("empty claim text")
  if (!claim.evidence_ids || claim.evidence_ids.length === 0) errors.push("no evidence linked")
  if (claim.confidence < 0.5) errors.push("low confidence")
  // Add more as needed
  return errors
}

export function validateClaims(claims: Claim[]): QualityGateResult {
  const hardFails: string[] = []
  const warnings: string[] = []
  for (const claim of claims) {
    const errs = validateClaim(claim)
    for (const err of errs) {
      if (QUALITY_HARD_FAILS.includes(err as any)) hardFails.push(err)
      else warnings.push(err)
    }
    if (claim.truth_state === "DERIVED") warnings.push("derived claim")
  }
  return {
    passed: hardFails.length === 0,
    hardFails,
    warnings,
  }
}

export function validateEvidence(evidence: EvidenceItem): string[] {
  const errors: string[] = []
  if (!evidence.content || evidence.content.trim().length === 0) errors.push("empty evidence content")
  if (evidence.confidence < 0.5) errors.push("low confidence evidence")
  return errors
}
