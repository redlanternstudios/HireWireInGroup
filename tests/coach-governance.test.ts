import { strict as assert } from "node:assert"
import test from "node:test"
import { validateAllClaims, validateCoachAnswer } from "../lib/coach/claim-validator"
import { scoreDrift } from "../lib/coach/drift-scorer"
import { buildGovernanceReport } from "../lib/coach/generation-governance"
import type { GovernanceEvidence } from "../lib/coach/types"

const evidence: GovernanceEvidence[] = [
  {
    id: "ev_product_delivery",
    source_title: "Lead Product Manager at Deloitte",
    source_type: "work_experience",
    confidence_level: "high",
    responsibilities: [
      "Troubleshot API, access, and platform-level issues",
    ],
    outcomes: [
      "Led Agile product delivery for Salesforce reporting dashboards and executive visibility",
    ],
    tools_used: ["SQL", "Salesforce"],
    team_size: null,
    budget_scope: null,
    user_impact_scale: null,
    what_not_to_overstate: null,
    approved_achievement_bullets: [],
  },
]

test("claim validator infers grounded evidence when provenance id is missing", () => {
  const validation = validateAllClaims(
    [
      {
        text: "Led Agile product delivery at Deloitte using Salesforce dashboards to improve executive visibility",
        cited_evidence_id: null,
      },
    ],
    [],
    evidence,
  )

  assert.equal(validation.hasFabricated, false)
  assert.equal(validation.bulletVerdicts[0].confidence, "high")
  assert.equal(validation.bulletVerdicts[0].cited_evidence_id, "ev_product_delivery")
})

test("claim validator treats weak stale-id matches as reviewable instead of fabricated", () => {
  const validation = validateAllClaims(
    [
      {
        text: "Coordinated discovery workshops, prioritized roadmap themes, aligned stakeholders, and prepared Salesforce launch updates for leaders",
        cited_evidence_id: "stale_retry_id",
      },
    ],
    [],
    evidence,
  )

  assert.equal(validation.hasFabricated, false)
  assert.equal(validation.bulletVerdicts[0].confidence, "medium")
  assert.equal(validation.bulletVerdicts[0].cited_evidence_id, "ev_product_delivery")
})

test("claim validator treats responsibilities as source evidence", () => {
  const validation = validateAllClaims(
    [
      {
        text: "Troubleshot API, access, and platform-level issues",
        cited_evidence_id: "ev_product_delivery",
      },
    ],
    [],
    evidence,
  )

  assert.equal(validation.hasFabricated, false)
  assert.equal(validation.bulletVerdicts[0].confidence, "high")
})

test("drift scorer does not treat common business nouns as unsupported tools", () => {
  const validation = validateAllClaims(
    [
      {
        text: "Led Agile product delivery at Deloitte using Salesforce dashboards to improve executive visibility",
        cited_evidence_id: null,
      },
    ],
    [],
    evidence,
  )

  const drift = scoreDrift({
    bulletTexts: [
      {
        text: "Led Agile product delivery at Deloitte using Salesforce dashboards to improve executive visibility",
        evidence_id: null,
      },
    ],
    paragraphTexts: [],
    bulletVerdicts: validation.bulletVerdicts,
    paragraphVerdicts: [],
    evidenceSet: evidence,
  })

  assert.equal(drift.score, 0)
  assert.equal(drift.is_blocking, false)
  assert.deepEqual(drift.flags, [])
})

test("coach answer validator recognizes modern PM/data stack tools", () => {
  const validation = validateCoachAnswer(
    "In Q3 2024, I led launch reporting for the Google Cloud team using Snowflake, Confluence, Linear, Asana, Looker, and Amplitude across 12 stakeholders.",
    "Product launch analytics",
  )

  assert.equal(validation.signals.hasEmployer, true)
  assert.equal(validation.signals.hasTool, true)
  assert.equal(validation.signals.hasTime, true)
  assert.equal(validation.signals.hasScope, true)
  assert.equal(validation.needsMoreDetail, false)
})

test("coach answer validator recognizes acronym employers", () => {
  const validation = validateCoachAnswer(
    "I worked for IBM in 2024 and used Snowflake to improve renewal reporting for 6 account teams.",
    "Enterprise reporting",
  )

  assert.equal(validation.signals.hasEmployer, true)
  assert.equal(validation.signals.hasTool, true)
})

test("governance report removes unsupported competencies and surfaces years gap", () => {
  const report = buildGovernanceReport({
    summary: "A product leader who builds AI enabled SaaS workflows and leads discovery.",
    jobText: "We need 5 plus years of product management experience and SQL.",
    requiredQualifications: ["5 plus years of product management experience", "SQL"],
    experience: [
      {
        start_date: "2021",
        end_date: "2025",
      },
    ],
    skills: ["Product strategy", "SQL", "Kubernetes"],
    bulletProvenance: [
      {
        bullet_text: "Led Agile product delivery at Deloitte using Salesforce dashboards to improve executive visibility",
        source_evidence_id: "ev_product_delivery",
        source_evidence_title: "Lead Product Manager at Deloitte",
        source_role: "Lead Product Manager",
        source_company: "Deloitte",
        matched_requirement_text: null,
        keywords_covered: ["product delivery"],
        risk_flags: [],
        is_metric_rich: false,
        concrete_signal_count: 2,
        claim_confidence: "high",
      },
    ],
    paragraphProvenance: [],
    evidenceSet: evidence,
  })

  assert.equal(report.yearsCovered, 4)
  assert.equal(report.requiredYears, 5)
  assert.equal(report.yearsGap, 1)
  assert.ok(report.gapReport.some((line) => line.includes("Years gap")))
  assert.deepEqual(report.filteredSkills, ["SQL"])
  assert.ok(report.removedSkills.includes("Kubernetes"))
  assert.equal(report.hasFabricated, false)
  assert.equal(report.isBlocking, false)
})

test("governance report blocks fabricated claims", () => {
  const report = buildGovernanceReport({
    summary: "A product leader who builds AI enabled SaaS workflows and leads discovery.",
    jobText: "We need 5 plus years of product management experience and SQL.",
    requiredQualifications: ["5 plus years of product management experience", "SQL"],
    experience: [],
    skills: ["SQL"],
    bulletProvenance: [
      {
        bullet_text: "Designed a pasta subscription CRM for musicians",
        source_evidence_id: "missing_evidence_id",
        source_evidence_title: "Unknown",
        source_role: "Technical Product Manager",
        source_company: "Ingram Micro",
        matched_requirement_text: null,
        keywords_covered: ["pasta"],
        risk_flags: [],
        is_metric_rich: false,
        concrete_signal_count: 1,
        claim_confidence: "high",
      },
    ],
    paragraphProvenance: [],
    evidenceSet: evidence,
  })

  assert.equal(report.hasFabricated, true)
  assert.equal(report.isBlocking, true)
  assert.ok(report.blockedReasons.length > 0)
})
