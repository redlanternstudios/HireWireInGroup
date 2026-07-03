import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { evaluateReadiness } from "./evaluator"

describe("evaluateReadiness", () => {
  it("blocks generation when skipped claims keep verified fit at or below seventy percent", () => {
    const result = evaluateReadiness({
      id: "job_1",
      status: "active",
      analysis_present: true,
      quality_passed: true,
      evidence_map: {
        requirement_matches: [
          {
            requirement_id: "required_1",
            requirement_text: "Lead product discovery",
            priority: "required",
            status: "met",
            confidence: "high",
            proof_decision: "auto_mapped",
            matched_evidence_ids: ["evidence_1"],
            matched_evidence_titles: ["Product launch"],
          },
          {
            requirement_id: "required_2",
            requirement_text: "Own enterprise pricing",
            priority: "required",
            status: "gap",
            confidence: "low",
            proof_decision: "needs_judgment",
            matched_evidence_ids: [],
            matched_evidence_titles: [],
          },
        ],
        capability_packets: [],
      },
      prove_fit_decisions: [
        {
          requirement_id: "required_2",
          decision: "skipped",
        },
      ],
    })

    assert.equal(result.checklist.evidence, true)
    assert.equal(result.checklist.coach, true)
    assert.equal(result.checklist.fit, false)
    assert.equal(result.canGenerate, false)
    assert.equal(result.displayState, "evidence_needed")
  })
})
