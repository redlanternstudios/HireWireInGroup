import test from "node:test"
import assert from "node:assert/strict"
import {
  buildEvidenceFixHref,
  getFirstUnresolvedRequirementId,
  listUnresolvedRequirements,
} from "../lib/evidence/unresolved-requirements"
import type {
  CanonicalJobEvidenceMap,
  RequirementEvidenceMatch,
} from "../lib/evidence/types"

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

function evidenceMap(matches: RequirementEvidenceMatch[]): CanonicalJobEvidenceMap {
  return {
    matching_complete: false,
    completed_at: "2026-05-31T00:00:00.000Z",
    requirement_matches: matches,
    capability_packets: matches.map((item) => ({
      packet_id: `pkt_${item.requirement_id}`,
      requirement: item.requirement_text,
      normalized: item.normalized_requirement,
      priority: item.priority,
      matchedEvidenceIds: item.matched_evidence_ids,
      matchedEvidenceTitles: item.matched_evidence_titles,
      proofSnippets: [],
      systems: [],
      tools: [],
      outcomes: [],
      responsibilities: [],
      companies: [],
      roles: [],
      matchStrength: item.matched_evidence_ids.length > 0 ? "strong" : "weak",
      matchScore: item.matched_evidence_ids.length > 0 ? 90 : 0,
      matchReason: "test fixture",
      evidenceStrength: item.confidence,
      riskFlags: [],
      allowedUsage: item.matched_evidence_ids.length > 0
        ? "resume_allowed"
        : "interview_only",
      proofDecision: item.proof_decision,
      userClaim: item.user_claim,
      whyIncluded: "test fixture",
    })),
    coverage_summary: {
      required_total: matches.length,
      required_met: 0,
      required_partial: 0,
      required_gaps: 0,
      preferred_total: 0,
      preferred_met: 0,
      keyword_total: 0,
      keyword_met: 0,
    },
    gap_summary: [],
  }
}

test("unresolved helper resolves confirmed only with prove_fit_decisions authority", () => {
  const map = evidenceMap([
    match("confirmed", {
      status: "met",
      proof_decision: "confirmed",
      matched_evidence_ids: ["ev_1"],
    }),
  ])

  assert.deepEqual(
    listUnresolvedRequirements({ evidence_map: map }).map((item) => item.id),
    ["confirmed"],
  )
  assert.deepEqual(
    listUnresolvedRequirements({
      evidence_map: map,
      prove_fit_decisions: [{ requirement_id: "confirmed", decision: "confirmed" }],
    }),
    [],
  )
})

test("unresolved helper resolves auto_mapped and skipped requirements", () => {
  const map = evidenceMap([
    match("auto", {
      status: "met",
      proof_decision: "auto_mapped",
      matched_evidence_ids: ["ev_1"],
    }),
    match("skip", {
      proof_decision: "skipped",
    }),
  ])

  assert.deepEqual(listUnresolvedRequirements({ evidence_map: map }), [])
})

test("unresolved helper treats partial, gap, unknown, and missing usable packets as unresolved", () => {
  const map = evidenceMap([
    match("partial", { status: "partial", matched_evidence_ids: ["ev_1"] }),
    match("gap", { status: "gap" }),
    match("unknown", { status: "unknown" }),
    match("no_packet", {
      status: "met",
      matched_evidence_ids: ["ev_2"],
    }),
  ])
  map.capability_packets = map.capability_packets.filter((packet) => packet.packet_id !== "pkt_no_packet")

  assert.deepEqual(
    listUnresolvedRequirements({ evidence_map: map }).map((item) => item.id),
    ["partial", "gap", "unknown", "no_packet"],
  )
  assert.equal(getFirstUnresolvedRequirementId({ evidence_map: map }), "partial")
  assert.equal(
    buildEvidenceFixHref("job_1", "partial"),
    "/jobs/job_1/evidence-match?req=partial#req-partial",
  )
})
