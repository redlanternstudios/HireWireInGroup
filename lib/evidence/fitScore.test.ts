import { describe, it, expect } from "vitest"
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
    expect(r.hasSignal).toBe(false)
    expect(r.fitScore).toBeNull()
    expect(r.meetsThreshold).toBe(false)
  })

  it("counts confirmed and met-auto-mapped as resolved; skipped/needs_judgment do not", () => {
    const r = computeFitScore([
      m("required", { proof_decision: "confirmed", status: "partial" }), // user attested -> counts
      m("required", { proof_decision: "auto_mapped", status: "met" }),
      m("required", { proof_decision: "skipped", status: "met" }),
      m("required", { proof_decision: "needs_judgment", status: "met" }),
    ])
    expect(r.requiredTotal).toBe(4)
    expect(r.requiredResolved).toBe(2)
    expect(r.requiredSkipped).toBe(1)
    expect(r.fitScore).toBe(50)
    expect(r.meetsThreshold).toBe(false)
  })

  it("does NOT count auto-mapped/undecided PARTIAL (weak fuzzy) matches as fit", () => {
    const r = computeFitScore([
      m("required", { proof_decision: "auto_mapped", status: "partial" }),
      m("required", { proof_decision: undefined, status: "partial" }),
      m("required", { proof_decision: undefined, status: "met" }),
    ])
    expect(r.requiredResolved).toBe(1) // only the "met" one
    expect(r.fitScore).toBe(33)
  })

  it("counts undecided MET matches as resolved (no persisted proof_decision)", () => {
    const r = computeFitScore([
      m("required", { status: "met" }),
      m("required", { status: "met" }),
      m("required", { status: "met" }),
    ])
    expect(r.fitScore).toBe(100)
    expect(r.meetsThreshold).toBe(true)
  })

  it("hits threshold at >= 70% met coverage", () => {
    const r = computeFitScore([
      m("required", { status: "met" }),
      m("required", { status: "met" }),
      m("required", { status: "met" }),
      m("required", { proof_decision: "skipped" }),
    ])
    expect(r.fitScore).toBe(75)
    expect(r.meetsThreshold).toBe(true)
    expect(FIT_THRESHOLD).toBe(70)
  })

  it("all gaps => 0% fit, gated", () => {
    const r = computeFitScore([
      m("required", { status: "gap" }),
      m("required", { status: "partial" }),
    ])
    expect(r.fitScore).toBe(0)
    expect(r.meetsThreshold).toBe(false)
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
    expect(r.requiredTotal).toBe(2)
    expect(r.fitScore).toBe(50)
  })

  it("falls back to all matches when no required tier exists", () => {
    const r = computeFitScore([
      m("preferred", { status: "met" }),
      m("preferred", { status: "gap" }),
    ])
    expect(r.requiredTotal).toBe(0)
    expect(r.fitScore).toBe(50)
  })
})
