import assert from "node:assert/strict"

import {
  buildEvidenceGraph,
  buildProfileContext,
  reverseEngineerJob,
  runContextGapMatch,
  validateGeneratedClaims,
} from "../lib/context-engine"

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

const resumeText = `
Jane Candidate
jane@example.com
Led SAP BRIM invoicing rollout across 60 countries, aligning finance, product, and engineering stakeholders.
Automated billing workflows and reduced manual reconciliation by 25%.
Skills: Salesforce, SQL, stakeholder management, product management
`

test("parse-profile extracts ATS-safe evidence only from supplied text", () => {
  const context = buildProfileContext({
    userId: "user-1",
    sourceId: "resume-1",
    sourceType: "resume",
    sourceLabel: "resume.pdf",
    rawText: resumeText,
  })

  assert.ok(context.evidenceItems.some((item) => item.evidence_type === "email" && item.normalized_value === "jane@example.com"))
  assert.ok(context.evidenceItems.some((item) => item.evidence_type === "metric" && item.normalized_value.includes("60 countries")))
  assert.equal(context.evidenceItems.some((item) => /python/i.test(item.normalized_value)), false)
})

test("normalize-profile preserves ambiguity flags", () => {
  const context = buildProfileContext({
    sourceType: "resume",
    sourceLabel: "resume.txt",
    rawText: "PM with AI and CRM experience.",
  })
  const pm = context.normalizedEntities.find((entity) => entity.canonical_name === "PM")
  const ai = context.normalizedEntities.find((entity) => entity.canonical_name === "artificial intelligence")

  assert.ok(pm?.ambiguity_flags.some((flag) => flag.includes("Product Manager")))
  assert.ok(ai?.ambiguity_flags.some((flag) => flag.includes("AI product")))
})

test("score-gap-match distinguishes direct, adjacent, and true gaps", () => {
  const profile = buildProfileContext({
    userId: "user-1",
    sourceType: "resume",
    sourceLabel: "resume.pdf",
    rawText: resumeText,
  })
  const job = reverseEngineerJob({
    jobId: "job-1",
    jobText: "Required: SAP BRIM billing rollout. Preferred: Python development. Must manage stakeholders.",
    requirements: ["SAP BRIM billing rollout", "Python development", "stakeholder management"],
  })
  const gap = runContextGapMatch({
    userId: "user-1",
    jobId: "job-1",
    profile,
    requirements: job.requirements,
  })

  assert.ok(gap.gapReport.matches.some((match) => match.match_type === "direct_match" || match.match_type === "terminology_mismatch"))
  assert.ok(gap.gapReport.matches.some((match) => match.match_type === "true_gap" || match.match_type === "unsupported"))
})

test("validate-claims blocks unsupported generated claims", () => {
  const profile = buildProfileContext({
    userId: "user-1",
    sourceType: "resume",
    sourceLabel: "resume.pdf",
    rawText: resumeText,
  })
  const supportedEvidence = profile.evidenceItems.find((item) => /SAP BRIM/i.test(item.raw_text))
  assert.ok(supportedEvidence)

  const verdicts = validateGeneratedClaims({
    userId: "user-1",
    jobId: "job-1",
    claims: [
      {
        id: "claim-1",
        claim_text: "Led SAP BRIM invoicing rollout across 60 countries.",
        evidence_ids: [supportedEvidence.id],
        document_type: "resume",
      },
      {
        id: "claim-2",
        claim_text: "Expert Python developer who built production ML services.",
        evidence_ids: [],
        document_type: "resume",
      },
    ],
    evidenceItems: profile.evidenceItems,
  })

  assert.equal(verdicts[0].verdict === "supported" || verdicts[0].verdict === "supported_with_reframe", true)
  assert.equal(verdicts[1].verdict, "blocked")
})

test("evidence graph links source to claim through evidence", () => {
  const profile = buildProfileContext({
    sourceType: "resume",
    sourceLabel: "resume.pdf",
    rawText: resumeText,
  })
  const evidence = profile.evidenceItems[0]
  const graph = buildEvidenceGraph({
    sources: [profile.source],
    evidenceItems: [evidence],
    claims: [{ id: "claim-1", claim_text: "Evidence-backed claim", evidence_ids: [evidence.id] }],
  })

  assert.ok(graph.edges.some((edge) => edge.relationship === "extracted_from"))
  assert.ok(graph.edges.some((edge) => edge.relationship === "supports"))
})

console.log("ContextEngine tests passed")
