import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildConfirmedProofUsageReport,
  type BulletProvenance,
  type ParagraphProvenance,
} from "./truthserum"
import type { EvidenceIntelligencePacket } from "./evidence/types"

const confirmedPacket: EvidenceIntelligencePacket = {
  packet_id: "pkt_req_1",
  requirement: "Stakeholder launch leadership",
  normalized: "stakeholder launch leadership",
  priority: "required",
  matchedEvidenceIds: ["ev_1"],
  matchedEvidenceTitles: ["Stripe launch"],
  proofSnippets: ["Led stakeholder alignment for a $2M product launch at Stripe in Q3 2024"],
  systems: [],
  tools: ["Stripe"],
  outcomes: ["$2M product launch"],
  responsibilities: ["Led stakeholder alignment"],
  companies: ["Stripe"],
  roles: ["Product Manager"],
  matchStrength: "strong",
  matchScore: 92,
  matchReason: "Confirmed by user",
  evidenceStrength: "high",
  riskFlags: [],
  allowedUsage: "resume_allowed",
  proofDecision: "confirmed",
  userClaim: "I led stakeholder alignment for a $2M product launch at Stripe in Q3 2024",
  whyIncluded: "User confirmed this proof in Match Interview",
}

const emptyParagraphs: ParagraphProvenance[] = []

describe("buildConfirmedProofUsageReport", () => {
  it("marks confirmed proof as used when a resume bullet cites its packet", () => {
    const bullets: BulletProvenance[] = [
      {
        bullet_text: "Led stakeholder alignment for a $2M Stripe product launch in Q3 2024",
        source_evidence_id: "ev_1",
        source_evidence_title: "Stripe launch",
        source_packet_id: "pkt_req_1",
        claim_confidence: "high",
        keywords_covered: [],
        risk_flags: [],
        is_metric_rich: true,
        concrete_signal_count: 3,
      },
    ]

    const report = buildConfirmedProofUsageReport([confirmedPacket], bullets, emptyParagraphs)

    assert.equal(report.length, 1)
    assert.equal(report[0].used, true)
    assert.deepEqual(report[0].used_in, ["resume"])
    assert.equal(report[0].generated_claims.length, 1)
  })

  it("marks confirmed proof as missing when generation drops it", () => {
    const report = buildConfirmedProofUsageReport([confirmedPacket], [], emptyParagraphs)

    assert.equal(report.length, 1)
    assert.equal(report[0].used, false)
    assert.deepEqual(report[0].used_in, [])
    assert.equal(report[0].generated_claims.length, 0)
  })
})
