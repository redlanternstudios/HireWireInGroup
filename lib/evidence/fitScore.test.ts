import { describe, it, expect } from "vitest"
import { computeFitScore, FIT_THRESHOLD } from "./fitScore"

const m = (priority: string, proof_decision?: string) =>
  ({ priority, proof_decision, requirement_id: Math.random().toString() } as any)

describe("computeFitScore", () => {
  it("returns no signal when there are no matches", () => {
    const r = computeFitScore([])
    expect(r.hasSignal).toBe(false)
    expect(r.fitScore).toBeNull()
    expect(r.meetsThreshold).toBe(false)
  })

  it("counts only auto_mapped/confirmed required as fit; skipped and gaps do not", () => {
    const r = computeFitScore([
      m("required", "auto_mapped"),
      m("required", "confirmed"),
      m("required", "skipped"),
      m("required", "needs_judgment"),
    ])
    expect(r.requiredTotal).toBe(4)
    expect(r.requiredResolved).toBe(2)
    expect(r.requiredSkipped).toBe(1)
    expect(r.requiredGaps).toBe(1)
    expect(r.fitScore).toBe(50)
    expect(r.meetsThreshold).toBe(false)
  })

  it("hits the threshold at >= 70% required coverage", () => {
    const r = computeFitScore([
      m("required", "confirmed"),
      m("required", "confirmed"),
      m("required", "auto_mapped"),
      m("required", "skipped"),
    ])
    expect(r.fitScore).toBe(75)
    expect(r.meetsThreshold).toBe(true)
    expect(FIT_THRESHOLD).toBe(70)
  })

  it("all skipped required => 0% fit, gated", () => {
    const r = computeFitScore([m("required", "skipped"), m("required", "skipped")])
    expect(r.fitScore).toBe(0)
    expect(r.meetsThreshold).toBe(false)
  })

  it("falls back to all matches when no required tier exists", () => {
    const r = computeFitScore([
      m("preferred", "confirmed"),
      m("preferred", "needs_judgment"),
    ])
    expect(r.requiredTotal).toBe(0)
    expect(r.fitScore).toBe(50)
  })
})
