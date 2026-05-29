import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

function read(path: string) {
  return readFileSync(path, "utf8")
}

test("Match Interview chat uses the canonical coach tool route", () => {
  const coachChat = read("components/coach-chat.tsx")
  const modal = read("components/coach/GapCoachDrawer.tsx")

  assert.match(coachChat, /api:\s*"\/api\/coach"/)
  assert.match(modal, /fetch\("\/api\/coach\/sessions"/)
  assert.doesNotMatch(modal, /\/api\/coach\/sessions\/\$\{[^}]+}\]\/messages/)
})

test("coach-step compatibility route delegates confirm and skip through routeToolCall", () => {
  const route = read("app/api/jobs/[id]/coach-step/route.ts")

  assert.match(route, /routeToolCall/)
  assert.match(route, /toolName:\s*"confirmProof"/)
  assert.match(route, /toolName:\s*"skipRequirement"/)
  assert.doesNotMatch(route, /\.from\("evidence_library"\)\s*[\s\S]{0,120}\.insert/)
  assert.doesNotMatch(route, /upsertProveFitDecision/)
  assert.match(route, /requirement_id_required/)
})

test("canonical confirmProof preserves negative claim constraints", () => {
  const execution = read("lib/coach/tool-execution.ts")

  assert.match(execution, /validateCoachAnswer/)
  assert.match(execution, /what_not_to_overstate:\s*answerValidation\.what_not_to_overstate/)
  assert.match(execution, /confidence_score:\s*answerValidation\.confidence/)
})

test("canonical skipRequirement blocks skipped claims from generation packets", () => {
  const execution = read("lib/coach/tool-execution.ts")
  const evidenceBuilder = read("lib/evidence/buildEvidenceMapForJob.ts")

  assert.match(execution, /proof_decision:\s*"skipped"/)
  assert.match(execution, /"user_skipped"/)
  assert.match(evidenceBuilder, /match\.proof_decision === "skipped" \? "blocked"/)
})
