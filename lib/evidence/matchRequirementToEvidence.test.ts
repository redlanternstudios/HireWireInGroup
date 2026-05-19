// @ts-nocheck
/**
 * lib/evidence/matchRequirementToEvidence.test.ts
 *
 * Unit tests for requirement-to-evidence matching logic.
 * Validates keyword extraction, similarity scoring, and edge cases.
 */

import { matchRequirementToEvidence } from "./matchRequirementToEvidence"
import type { Evidence } from "./matchRequirementToEvidence"

// Mock evidence records
const mockEvidence: Evidence[] = [
  {
    id: "ev-001",
    user_id: "user-1",
    title: "AWS Solutions Architect",
    company_name: "TechCorp",
    description: "Designed and deployed cloud infrastructure using AWS",
    achievements: ["Built VPC architectures", "Implemented CI/CD pipelines"],
    skills_demonstrated: ["AWS", "Infrastructure", "Architecture"],
    tools_used: ["AWS EC2", "S3", "RDS"],
    start_date: "2020-01-01",
    end_date: "2022-01-01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    tags: ["cloud"],
    domain: "infrastructure",
    metrics: null,
    outcomes: null,
    team_size: null,
    budget_scope: null,
    user_impact_scale: null,
    what_not_to_overstate: null,
    requirement_coverage: null,
    evidence_metadata: null,
  },
  {
    id: "ev-002",
    user_id: "user-1",
    title: "Frontend React Developer",
    company_name: "WebStart",
    description: "Built interactive web applications with React and TypeScript",
    achievements: ["Reduced bundle size by 40%", "Implemented real-time features"],
    skills_demonstrated: ["React", "TypeScript", "JavaScript"],
    tools_used: ["React", "Redux", "Jest"],
    start_date: "2021-01-01",
    end_date: "2023-01-01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    tags: ["frontend"],
    domain: "engineering",
    metrics: null,
    outcomes: null,
    team_size: null,
    budget_scope: null,
    user_impact_scale: null,
    what_not_to_overstate: null,
    requirement_coverage: null,
    evidence_metadata: null,
  },
  {
    id: "ev-003",
    user_id: "user-1",
    title: "Program Manager",
    company_name: "MegaCorp",
    description: "Managed cross-functional teams and product roadmaps",
    achievements: ["Shipped product in 6 months", "Coordinated 15+ stakeholders"],
    skills_demonstrated: ["Project Management", "Leadership", "Communication"],
    tools_used: ["Jira", "Confluence"],
    start_date: "2019-01-01",
    end_date: "2021-01-01",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    tags: ["management"],
    domain: "product",
    metrics: null,
    outcomes: null,
    team_size: 15,
    budget_scope: null,
    user_impact_scale: null,
    what_not_to_overstate: null,
    requirement_coverage: null,
    evidence_metadata: null,
  },
]

describe("matchRequirementToEvidence", () => {
  it("should match AWS requirement to AWS evidence", () => {
    const requirement = "5+ years of AWS cloud architecture experience"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    expect(result.evidenceId).toBe("ev-001")
    expect(result.matchScore).toBeGreaterThan(0.3)
    expect(result.evidence?.id).toBe("ev-001")
  })

  it("should match React requirement to React evidence", () => {
    const requirement = "React and TypeScript development experience"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    expect(result.evidenceId).toBe("ev-002")
    expect(result.matchScore).toBeGreaterThan(0.3)
    expect(result.evidence?.company_name).toBe("WebStart")
  })

  it("should match leadership requirement to program manager evidence", () => {
    const requirement = "Strong leadership and cross-functional team coordination"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    expect(result.evidenceId).toBe("ev-003")
    expect(result.matchScore).toBeGreaterThan(0.2)
  })

  it("should return null match for empty evidence set", () => {
    const requirement = "Any requirement"
    const result = matchRequirementToEvidence(requirement, [])

    expect(result.evidenceId).toBeNull()
    expect(result.matchScore).toBe(0)
    expect(result.evidence).toBeNull()
  })

  it("should return null match for requirement with no meaningful keywords", () => {
    const requirement = "a an the or but"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    expect(result.evidenceId).toBeNull()
    expect(result.matchScore).toBe(0)
  })

  it("should handle case-insensitive matching", () => {
    const requirement = "AWS CLOUD ARCHITECTURE"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    expect(result.evidenceId).toBe("ev-001")
    expect(result.matchScore).toBeGreaterThan(0)
  })

  it("should score partial matches", () => {
    const requirement = "JavaScript development"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    // React evidence should score higher than AWS evidence
    expect(result.evidenceId).toBe("ev-002")
    expect(result.matchScore).toBeGreaterThan(0.2)
  })

  it("should return the best match among multiple candidates", () => {
    const requirement = "React and TypeScript for web applications"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    // Should match React evidence (ev-002), not AWS (ev-001) or PM (ev-003)
    expect(result.evidenceId).toBe("ev-002")
    expect(result.evidence?.skills_demonstrated).toContain("React")
  })

  it("should handle requirements with special characters", () => {
    const requirement = "C++ & Python (backend) or Go/Rust experience"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    // Should not crash and should return a valid result
    expect(result).toHaveProperty("evidenceId")
    expect(result).toHaveProperty("matchScore")
    expect(result).toHaveProperty("evidence")
  })

  it("should score zero when no keywords overlap", () => {
    const requirement = "Underwater basket weaving expertise"
    const result = matchRequirementToEvidence(requirement, mockEvidence)

    // Should not match any evidence
    expect(result.matchScore).toBe(0)
    expect(result.evidenceId).toBeNull()
  })
})
