import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { computeFitScore, FIT_THRESHOLD } from "./fitScore"

// priority + optional { proof_decision, status }
const m = (
  priority: string,
  opts: { proof_decision?: string; status?: string } = {},
) =>
  ({
    priority,
    proof_decision: opts.proof_decision,
    status: opts.status ?? "met",
    matched_evidence_ids: ["e1"],
    requirement_text: "Lead cross-functional product delivery",
    requirement_id: Math.random().toString(),
  } as any)

describe("computeFitScore", () => {
  it("returns no signal when there are no matches", () => {
    const r = computeFitScore([])
    assert.equal(r.hasSignal, false)
    assert.equal(r.fitScore, null)
    assert.equal(r.meetsThreshold, false)
  })

  it("counts confirmed and met-auto-mapped as resolved; skipped/needs_judgment do not", () => {
    const r = computeFitScore([
      m("required", { proof_decision: "confirmed", status: "partial" }), // user attested -> counts
      m("required", { proof_decision: "auto_mapped", status: "met" }),
      m("required", { proof_decision: "skipped", status: "met" }),
      m("required", { proof_decision: "needs_judgment", status: "met" }),
    ])
    assert.equal(r.requiredTotal, 4)
    assert.equal(r.requiredResolved, 2)
    assert.equal(r.requiredSkipped, 1)
    assert.equal(r.fitScore, 50)
    assert.equal(r.meetsThreshold, false)
  })

  it("does NOT count auto-mapped/undecided PARTIAL (weak fuzzy) matches as fit", () => {
    const r = computeFitScore([
      m("required", { proof_decision: "auto_mapped", status: "partial" }),
      m("required", { proof_decision: undefined, status: "partial" }),
      m("required", { proof_decision: undefined, status: "met" }),
    ])
    assert.equal(r.requiredResolved, 1)
    assert.equal(r.fitScore, 33)
  })

  it("counts undecided MET matches as resolved (no persisted proof_decision)", () => {
    const r = computeFitScore([
      m("required", { status: "met" }),
      m("required", { status: "met" }),
      m("required", { status: "met" }),
    ])
    assert.equal(r.fitScore, 100)
    assert.equal(r.meetsThreshold, true)
  })

  it("passes above seventy percent met coverage", () => {
    const r = computeFitScore([
      m("required", { status: "met" }),
      m("required", { status: "met" }),
      m("required", { status: "met" }),
      m("required", { proof_decision: "skipped" }),
    ])
    assert.equal(r.fitScore, 75)
    assert.equal(r.meetsThreshold, true)
    assert.equal(FIT_THRESHOLD, 70)
  })

  it("does not pass at exactly seventy percent", () => {
    const matches = Array.from({ length: 10 }, (_, index) =>
      m("required", { status: index < 7 ? "met" : "gap" }),
    )
    const r = computeFitScore(matches)
    assert.equal(r.fitScore, 70)
    assert.equal(r.meetsThreshold, false)
  })

  it("all gaps => 0% fit, gated", () => {
    const r = computeFitScore([
      m("required", { status: "gap" }),
      m("required", { status: "partial" }),
    ])
    assert.equal(r.fitScore, 0)
    assert.equal(r.meetsThreshold, false)
  })

  it("excludes boilerplate requirements (posting headline) from fit", () => {
    const headline = {
      priority: "required",
      status: "met",
      matched_evidence_ids: ["e1"],
      requirement_text: "E2E Labs 1779356362335 is hiring a Lead Product Manager",
      requirement_id: "bp",
    } as any
    const r = computeFitScore([
      headline,
      m("required", { status: "met" }),
      m("required", { status: "gap" }),
    ])
    // headline dropped -> only 2 real requirements counted, 1 met
    assert.equal(r.requiredTotal, 2)
    assert.equal(r.fitScore, 50)
  })

  it("falls back to all matches when no required tier exists", () => {
    const r = computeFitScore([
      m("preferred", { status: "met" }),
      m("preferred", { status: "gap" }),
    ])
    assert.equal(r.requiredTotal, 0)
    assert.equal(r.fitScore, 50)
  })
})
