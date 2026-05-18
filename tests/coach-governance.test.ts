import { strict as assert } from "node:assert"
import test from "node:test"
import { validateAllClaims } from "../lib/coach/claim-validator"
import { scoreDrift } from "../lib/coach/drift-scorer"
import type { GovernanceEvidence } from "../lib/coach/types"

const evidence: GovernanceEvidence[] = [
  {
    id: "ev_product_delivery",
    source_title: "Lead Product Manager at Deloitte",
    source_type: "work_experience",
    confidence_level: "high",
    outcomes: [
      "Led Agile product delivery for Salesforce reporting dashboards and executive visibility",
    ],
    tools_used: [],
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
