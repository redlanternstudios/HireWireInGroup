import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  categorizeGap,
  calculateExplainableFit,
  type CanonicalEvidence,
  type DimensionScores,
} from "./canonical-evidence"

const optimisticDimensions: DimensionScores = {
  experience: 80,
  evidence: 80,
  skills: 80,
  seniority: 80,
  ats: 80,
}

describe("calculateExplainableFit", () => {
  it("does not give the old 32-point floor when there is no evidence", () => {
    const fit = calculateExplainableFit(
      [],
      ["React product delivery", "SQL analytics"],
      [],
      optimisticDimensions,
    )

    assert.equal(fit.score, 0)
    assert.equal(fit.band, "low_match")
    assert.equal(fit.matched_requirements_count, 0)
    assert.equal(fit.partial_matches_count, 0)
    assert.equal(fit.missing_requirements_count, 2)
  })

  it("still rewards real requirement coverage", () => {
    const evidence: CanonicalEvidence[] = [
      {
        id: "ev_react",
        source: "evidence_library",
        text: "Built React product dashboards for enterprise analytics teams",
        evidence_type: "work_experience",
        confidence: "high",
        is_verified: true,
        tags: [],
        skills: ["React", "analytics"],
        industries: [],
        approved_for_resume: true,
        approved_for_cover_letter: true,
        approved_for_interview: true,
        quantification_safety: "qualitative_supported",
        numeric_claims: [],
      },
    ]

    const fit = calculateExplainableFit(
      evidence,
      ["React product dashboards"],
      [],
      optimisticDimensions,
    )

    assert.ok(fit.score > 32)
    assert.equal(fit.matched_requirements_count, 1)
  })
})

describe("categorizeGap", () => {
  it("treats military and volunteer evidence as transferable proof instead of missing evidence", () => {
    assert.equal(categorizeGap("military", "unsupported"), "transferable_unproven")
    assert.equal(categorizeGap("volunteer", "unsupported"), "transferable_unproven")
  })

  it("keeps true no-evidence requirements as missing evidence", () => {
    assert.equal(categorizeGap(null, "no_evidence"), "missing_evidence")
  })
})
