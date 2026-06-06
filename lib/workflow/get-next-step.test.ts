import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getNextStep } from "./get-next-step"
import type { GuidedFlowJob } from "./step-types"
import type { EvidenceIntelligencePacket } from "@/lib/evidence/types"

function usablePacket(overrides: Partial<EvidenceIntelligencePacket> = {}): EvidenceIntelligencePacket {
  return {
    packet_id: "pkt_req_1",
    requirement: "Own roadmap planning",
    normalized: "own roadmap planning",
    priority: "required",
    matchedEvidenceIds: ["ev_1"],
    matchedEvidenceTitles: ["Roadmap launch"],
    proofSnippets: ["Owned roadmap planning for a product launch."],
    systems: [],
    tools: ["Jira"],
    outcomes: ["Launched roadmap operating rhythm."],
    responsibilities: ["Owned roadmap planning."],
    companies: ["Acme"],
    roles: ["Product Manager"],
    matchStrength: "strong",
    matchScore: 90,
    matchReason: "Confirmed.",
    evidenceStrength: "high",
    riskFlags: [],
    allowedUsage: "resume_allowed",
    whyIncluded: "Required requirement matched to confirmed evidence.",
    ...overrides,
  }
}

function baseJob(overrides: Partial<GuidedFlowJob> = {}): GuidedFlowJob {
  return {
    id: "job_1",
    status: "analyzed",
    role_title: "Product Manager",
    company_name: "Acme",
    applied_at: null,
    generated_resume: null,
    generated_cover_letter: null,
    quality_passed: null,
    score: 72,
    score_gaps: [],
    gaps_addressed: [],
    gap_clarifications: [],
    evidence_map: {
      matching_complete: true,
      completed_at: new Date().toISOString(),
      requirement_matches: [],
      capability_packets: [],
      coverage_summary: {
        required_total: 0,
        required_met: 0,
        required_partial: 0,
        required_gaps: 0,
        preferred_total: 0,
        preferred_met: 0,
        keyword_total: 0,
        keyword_met: 0,
      },
      gap_summary: [],
      _coach_step: { status: "completed" },
    },
    ...overrides,
  }
}

describe("getNextStep", () => {
  it("asks for one example when a required requirement is still a gap", () => {
    const step = getNextStep(baseJob({
      evidence_map: {
        matching_complete: true,
        completed_at: new Date().toISOString(),
        requirement_matches: [{
          requirement_id: "req_1",
          requirement_text: "Own roadmap planning",
          normalized_requirement: "Own roadmap planning",
          priority: "required",
          status: "gap",
          matched_evidence_ids: [],
          matched_evidence_titles: [],
          evidence_types: [],
          confidence: "low",
          match_method: "fuzzy",
          reasoning: "No evidence yet.",
        }],
        capability_packets: [usablePacket()],
        coverage_summary: {
          required_total: 1,
          required_met: 0,
          required_partial: 0,
          required_gaps: 1,
          preferred_total: 0,
          preferred_met: 0,
          keyword_total: 0,
          keyword_met: 0,
        },
        gap_summary: ["Own roadmap planning"],
        _coach_step: { status: "completed" },
      },
    }))

    assert.equal(step.type, "add_example")
    assert.equal(step.requirement?.requirement_id, "req_1")
  })

  it("routes to generation once evidence and coach gates are satisfied", () => {
    const step = getNextStep(baseJob({
      evidence_map: {
        matching_complete: true,
        completed_at: new Date().toISOString(),
        requirement_matches: [{
          requirement_id: "req_1",
          requirement_text: "Own roadmap planning",
          normalized_requirement: "Own roadmap planning",
          priority: "required",
          status: "met",
          matched_evidence_ids: ["ev_1"],
          matched_evidence_titles: ["Roadmap launch"],
          evidence_types: ["work_experience"],
          confidence: "high",
          match_method: "manual",
          reasoning: "Confirmed.",
        }],
        capability_packets: [usablePacket()],
        coverage_summary: {
          required_total: 1,
          required_met: 1,
          required_partial: 0,
          required_gaps: 0,
          preferred_total: 0,
          preferred_met: 0,
          keyword_total: 0,
          keyword_met: 0,
        },
        gap_summary: [],
        _coach_step: { status: "completed" },
      },
    }))

    assert.equal(step.type, "generate")
  })

  it("asks legacy analyzed jobs to refresh when no canonical evidence map exists", () => {
    const step = getNextStep(baseJob({ evidence_map: null, score: 70 }))

    assert.equal(step.type, "refresh_analysis")
  })

  it("routes generated packages to review before apply", () => {
    const step = getNextStep(baseJob({
      generated_resume: "Resume",
      generated_cover_letter: "Cover letter",
      quality_passed: false,
      evidence_map: {
        matching_complete: true,
        completed_at: new Date().toISOString(),
        requirement_matches: [{
          requirement_id: "req_1",
          requirement_text: "Own roadmap planning",
          normalized_requirement: "Own roadmap planning",
          priority: "required",
          status: "met",
          matched_evidence_ids: ["ev_1"],
          matched_evidence_titles: ["Roadmap launch"],
          evidence_types: ["work_experience"],
          confidence: "high",
          match_method: "manual",
          reasoning: "Confirmed.",
        }],
        capability_packets: [usablePacket()],
        coverage_summary: {
          required_total: 1,
          required_met: 1,
          required_partial: 0,
          required_gaps: 0,
          preferred_total: 0,
          preferred_met: 0,
          keyword_total: 0,
          keyword_met: 0,
        },
        gap_summary: [],
        _coach_step: { status: "completed" },
      },
    }))

    assert.equal(step.type, "review")
  })

  it("routes quality-approved packages to apply", () => {
    const step = getNextStep(baseJob({
      generated_resume: "Resume",
      generated_cover_letter: "Cover letter",
      quality_passed: true,
      evidence_map: {
        matching_complete: true,
        completed_at: new Date().toISOString(),
        requirement_matches: [{
          requirement_id: "req_1",
          requirement_text: "Own roadmap planning",
          normalized_requirement: "Own roadmap planning",
          priority: "required",
          status: "met",
          matched_evidence_ids: ["ev_1"],
          matched_evidence_titles: ["Roadmap launch"],
          evidence_types: ["work_experience"],
          confidence: "high",
          match_method: "manual",
          reasoning: "Confirmed.",
        }],
        capability_packets: [usablePacket()],
        coverage_summary: {
          required_total: 1,
          required_met: 1,
          required_partial: 0,
          required_gaps: 0,
          preferred_total: 0,
          preferred_met: 0,
          keyword_total: 0,
          keyword_met: 0,
        },
        gap_summary: [],
        _coach_step: { status: "completed" },
      },
    }))

    assert.equal(step.type, "apply")
  })

  it("does not route to generation when required evidence has no usable resume packet", () => {
    const step = getNextStep(baseJob({
      evidence_map: {
        matching_complete: true,
        completed_at: new Date().toISOString(),
        requirement_matches: [{
          requirement_id: "req_1",
          requirement_text: "Own roadmap planning",
          normalized_requirement: "Own roadmap planning",
          priority: "required",
          status: "met",
          matched_evidence_ids: ["ev_1"],
          matched_evidence_titles: ["Roadmap launch"],
          evidence_types: ["work_experience"],
          confidence: "high",
          match_method: "manual",
          reasoning: "Confirmed.",
        }],
        capability_packets: [usablePacket({ matchStrength: "weak" })],
        coverage_summary: {
          required_total: 1,
          required_met: 1,
          required_partial: 0,
          required_gaps: 0,
          preferred_total: 0,
          preferred_met: 0,
          keyword_total: 0,
          keyword_met: 0,
        },
        gap_summary: [],
        _coach_step: { status: "completed" },
      },
    }))

    assert.equal(step.type, "add_example")
    assert.ok(step.readiness.blockedReasons.includes("Missing usable evidence packet for Own roadmap planning"))
  })

  it("shows done for submitted jobs", () => {
    const step = getNextStep(baseJob({
      status: "applied",
      applied_at: new Date().toISOString(),
    }))

    assert.equal(step.type, "done")
  })
})
