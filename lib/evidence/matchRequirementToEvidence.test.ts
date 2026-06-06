import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { matchRequirementToEvidence } from "./matchRequirementToEvidence"
import type { RequirementPriority } from "./types"

describe("matchRequirementToEvidence", () => {
  const evidenceCandidates: Parameters<typeof matchRequirementToEvidence>[0]["evidenceCandidates"] = [
    {
      id: "1",
      source_title: "Bachelor of Science in Computer Science",
      source_type: "education",
      confidence_level: "high",
      is_user_approved: true,
    },
    {
      id: "2",
      source_title: "PMP",
      source_type: "certification",
      confidence_level: "high",
      is_user_approved: true,
    },
    {
      id: "3",
      source_title: "Scrum Master",
      source_type: "certification",
      confidence_level: "medium",
      is_user_approved: true,
    },
    {
      id: "4",
      source_title: "Salesforce Platform Developer",
      source_type: "certification",
      confidence_level: "high",
      is_user_approved: true,
    },
    {
      id: "5",
      source_title: "AI Product Management",
      source_type: "project",
      confidence_level: "medium",
      is_user_approved: true,
    },
    {
      id: "6",
      source_title: "Next.js & Supabase SaaS",
      source_type: "project",
      confidence_level: "medium",
      is_user_approved: true,
    },
    {
      id: "7",
      source_title: "Technical Product Manager",
      source_type: "work_experience",
      role_name: "Technical Product Manager",
      responsibilities: ["Owned product roadmap and collaborated with engineering"],
      confidence_level: "high",
      is_user_approved: true,
    },
    {
      id: "8",
      source_title: "Lead Product Manager",
      source_type: "work_experience",
      role_name: "Lead Product Manager",
      responsibilities: ["Led product strategy across a cross-functional team"],
      confidence_level: "high",
      is_user_approved: true,
    },
  ]

  it("matches B.S. Computer Science to Bachelor’s degree in Computer Science", () => {
    const result = matchRequirementToEvidence({
      requirement: "Bachelor’s degree in Computer Science",
      priority: "required" as RequirementPriority,
      evidenceCandidates,
    })
    assert.equal(result.status, "met")
    assert.ok(result.matched_evidence_ids.includes("1"))
  })

  it("matches CS Degree to Bachelor of Science in Computer Science", () => {
    const result = matchRequirementToEvidence({
      requirement: "CS Degree",
      priority: "required" as RequirementPriority,
      evidenceCandidates,
    })
    assert.equal(result.status, "met")
    assert.ok(result.matched_evidence_ids.includes("1"))
  })

  it("matches certification evidence to certification requirement", () => {
    const result = matchRequirementToEvidence({
      requirement: "PMP certification",
      priority: "required" as RequirementPriority,
      evidenceCandidates,
    })
    assert.equal(result.status, "met")
    assert.ok(result.matched_evidence_ids.includes("2"))
  })

  it("matches skill evidence to tool requirement", () => {
    const result = matchRequirementToEvidence({
      requirement: "Salesforce experience",
      priority: "required" as RequirementPriority,
      evidenceCandidates,
    })
    assert.equal(result.status, "met")
    assert.ok(result.matched_evidence_ids.includes("4"))
  })

  it("matches project evidence to AI/ML product experience", () => {
    const result = matchRequirementToEvidence({
      requirement: "AI/ML product experience",
      priority: "required" as RequirementPriority,
      evidenceCandidates,
    })
    assert.ok(result.status === "met" || result.status === "partial")
    assert.ok(result.matched_evidence_ids.includes("5"))
  })

  it("returns gap when no evidence matches", () => {
    const result = matchRequirementToEvidence({
      requirement: "CFA Charterholder",
      priority: "required" as RequirementPriority,
      evidenceCandidates,
    })
    assert.equal(result.status, "gap")
    assert.equal(result.matched_evidence_ids.length, 0)
  })

  it("flags seniority mismatch when job seniority exceeds matching evidence role level", () => {
    const result = matchRequirementToEvidence({
      requirement: "Product roadmap ownership",
      seniorityLevel: "Lead",
      priority: "required" as RequirementPriority,
      evidenceCandidates: [evidenceCandidates[6]],
    })

    assert.equal(result.status, "met")
    assert.ok(result.riskFlags?.includes("seniority_mismatch"))
  })

  it("does not flag seniority mismatch when matched evidence is at the required level", () => {
    const result = matchRequirementToEvidence({
      requirement: "Product strategy leadership",
      seniorityLevel: "Lead",
      priority: "required" as RequirementPriority,
      evidenceCandidates: [evidenceCandidates[7]],
    })

    assert.equal(result.status, "met")
    assert.ok(!result.riskFlags?.includes("seniority_mismatch"))
  })
})
