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
})
