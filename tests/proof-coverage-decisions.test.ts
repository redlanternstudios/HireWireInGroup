import test from "node:test"
import assert from "node:assert/strict"
import {
  applyAutoMappedProofDecisions,
  applyProofDecisionsToMatches,
  isMatchingComplete,
} from "../lib/evidence/proofCoverage"
import type { RequirementEvidenceMatch } from "../lib/evidence/types"

function match(
  requirement_id: string,
  overrides: Partial<RequirementEvidenceMatch> = {},
): RequirementEvidenceMatch {
  return {
    requirement_id,
    requirement_text: `Requirement ${requirement_id}`,
    normalized_requirement: requirement_id,
    priority: "required",
    status: "gap",
    matched_evidence_ids: [],
    matched_evidence_titles: [],
    evidence_types: [],
    confidence: "low",
    match_method: "fuzzy",
    reasoning: "test fixture",
    ...overrides,
  }
}

test("proof coverage applies confirmed decisions from prove_fit_decisions", () => {
  const merged = applyProofDecisionsToMatches(
    [match("req_1")],
    [{
      requirement_id: "req_1",
      decision: "confirmed",
      evidence_id: "ev_1",
      claim_text: "Confirmed claim",
      updated_at: "2026-05-31T00:00:00.000Z",
    }],
    [{ id: "ev_1", source_title: "Project Alpha", source_type: "project" }],
  )

  assert.equal(merged[0].proof_decision, "confirmed")
  assert.equal(merged[0].status, "met")
  assert.deepEqual(merged[0].matched_evidence_ids, ["ev_1"])
  assert.equal(isMatchingComplete(merged), true)
})

test("proof coverage auto maps matches with existing evidence", () => {
  const [mapped] = applyAutoMappedProofDecisions([
    match("req_1", {
      status: "met",
      matched_evidence_ids: ["ev_1"],
    }),
  ])

  assert.equal(mapped.proof_decision, "auto_mapped")
  assert.equal(isMatchingComplete([mapped]), true)
})

test("proof coverage keeps skipped requirements complete", () => {
  const [skipped] = applyAutoMappedProofDecisions([
    match("req_1", {
      proof_decision: "skipped",
    }),
  ])

  assert.equal(skipped.proof_decision, "skipped")
  assert.equal(isMatchingComplete([skipped]), true)
})

test("proof coverage ignores stale cached confirmed when no decision row is present", () => {
  const [stale] = applyAutoMappedProofDecisions([
    match("req_1", {
      status: "met",
      proof_decision: "confirmed",
      matched_evidence_ids: ["ev_1"],
    }),
  ])

  assert.equal(stale.proof_decision, "needs_judgment")
  assert.equal(isMatchingComplete([stale]), false)
})
