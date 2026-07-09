import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

import { COACH_SYSTEM_PROMPT } from "../lib/ai/prompts/coach"
import { JOB_ANALYSIS_PROMPT } from "../lib/ai/prompts/job-analysis"
import { buildCoachSystemPrompt } from "../lib/coach/buildCoachPrompt"

function readFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

test("coach prompts stay neutral across role families", () => {
  const sessionPrompt = buildCoachSystemPrompt({
    gapRequirement: "Lead role ownership",
    requirementId: "gap-1",
    currentEvidence: [],
    jobTitle: "Lead role",
    jobCompany: "ExampleCo",
    jobDescriptionSummary: "Example role",
    existingEvidenceTitles: [],
    priorMessages: [],
  })

  assert.match(sessionPrompt, /neutral language/i)
  assert.match(sessionPrompt, /role family/i)
  assert.match(COACH_SYSTEM_PROMPT, /neutral label/i)
  assert.match(COACH_SYSTEM_PROMPT, /not bias advice toward one role family/i)
  assert.match(readFile("app/api/coach/route.ts"), /neutral label/i)
})

test("job analysis prompt keeps role families neutral", () => {
  const analyzeRoute = readFile("lib/analyze/analyze-job-core.ts")

  assert.match(JOB_ANALYSIS_PROMPT, /neutral categories/i)
  assert.match(JOB_ANALYSIS_PROMPT, /do not bias toward engineering, product, operations, or management/i)
  assert.match(analyzeRoute, /Treat role families as neutral labels/i)
  assert.match(analyzeRoute, /do not bias toward engineering, product, operations, or management/i)
})
