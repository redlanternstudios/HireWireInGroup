import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  isActionableRequirementText,
  sanitizeKeywordList,
  sanitizeRequirementList,
} from "./requirement-quality"
import { listUnresolvedRequirements } from "./unresolved-requirements"

describe("requirement quality", () => {
  it("keeps concise job requirements", () => {
    assert.equal(
      isActionableRequirementText("Lead cross functional product discovery with enterprise customers"),
      true,
    )
  })

  it("rejects navigation and scraped page boilerplate", () => {
    assert.equal(
      isActionableRequirementText(
        "Job Application for Product Manager Back to jobs Apply now and see this and similar jobs on LinkedIn",
      ),
      false,
    )
  })

  it("rejects whole job descriptions", () => {
    assert.equal(
      isActionableRequirementText(
        "This role owns the complete product lifecycle from research through launch and partners with engineering design sales operations customer success legal security finance and executive leadership while defining strategy metrics roadmaps experiments pricing packaging enablement documentation support processes and long term platform investments across multiple markets and regions worldwide",
      ),
      false,
    )
  })

  it("deduplicates and limits requirements", () => {
    assert.deepEqual(
      sanitizeRequirementList([
        "Own the product roadmap",
        "Own the product roadmap",
        "Partner with engineering leaders",
      ], 2),
      ["Own the product roadmap", "Partner with engineering leaders"],
    )
  })

  it("keeps concise keywords and rejects sentences", () => {
    assert.deepEqual(
      sanitizeKeywordList([
        "Product strategy",
        "Product strategy",
        "This is an entire sentence that should never become an ATS keyword because it contains far too many separate words",
      ]),
      ["Product strategy"],
    )
  })

  it("keeps optional keywords out of the coach interview", () => {
    const unresolved = listUnresolvedRequirements({
      requirement_matches: [
        {
          requirement_id: "required_1",
          requirement_text: "Lead enterprise product discovery",
          priority: "required",
          status: "gap",
          confidence: "low",
          matched_evidence_ids: [],
          matched_evidence_titles: [],
          proof_needed: [],
          evidence_questions: [],
        },
        {
          requirement_id: "keyword_1",
          requirement_text: "Product analytics",
          priority: "keyword",
          status: "gap",
          confidence: "low",
          matched_evidence_ids: [],
          matched_evidence_titles: [],
          proof_needed: [],
          evidence_questions: [],
        },
      ],
      capability_packets: [],
    })

    assert.deepEqual(unresolved.map((item) => item.requirement_id), ["required_1"])
  })

  it("closes skipped requirements from decision authority", () => {
    const unresolved = listUnresolvedRequirements({
      evidence_map: {
        requirement_matches: [
          {
            requirement_id: "required_1",
            requirement_text: "Lead enterprise product discovery",
            priority: "required",
            status: "gap",
            confidence: "low",
            matched_evidence_ids: [],
            matched_evidence_titles: [],
            proof_needed: [],
            evidence_questions: [],
          },
        ],
        capability_packets: [],
      },
      prove_fit_decisions: [
        {
          requirement_id: "required_1",
          decision: "skipped",
        },
      ],
    })

    assert.deepEqual(unresolved, [])
  })
})
