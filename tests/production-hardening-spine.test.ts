import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

function read(path: string) {
  return readFileSync(path, "utf8")
}

test("package review has one canonical action and never trusts client userId", () => {
  const preview = read("components/documents/ApplicationPackagePreview.tsx")
  const canonical = read("lib/actions/package.ts")

  assert.doesNotMatch(preview, /package-review/)
  assert.match(preview, /@\/lib\/actions\/package/)
  assert.doesNotMatch(canonical, /userId:\s*string/)
  assert.match(canonical, /OUTCOME_STATUSES/)
  assert.match(canonical, /status:\s*"ready"/)
  assert.match(canonical, /status:\s*"needs_review"/)
})

test("MCP relay skips when no absolute relay URL exists", () => {
  const agent = read("integrations/mcp/agent.ts")

  assert.match(agent, /NEXT_PUBLIC_SITE_URL/)
  assert.match(agent, /status:\s*'skipped'/)
  assert.doesNotMatch(agent, /''}\/api\/mcp\/relay/)
})

test("outcome route uses requireUser, writes learning, and emits orchestrated event", () => {
  const route = read("app/api/jobs/[id]/outcome/route.ts")

  assert.match(route, /requireUser/)
  assert.match(route, /writeOutcomeLearning/)
  assert.match(route, /handleDomainEvent/)
  assert.doesNotMatch(route, /emitDomainEventWithClient/)
  assert.doesNotMatch(route, /supabase\.auth\.getUser/)
})

test("voice drift uses domain-event orchestration so recomputes fire", () => {
  const generate = read("app/api/generate-documents/route.ts")
  const voiceDriftBlock = generate.slice(generate.indexOf('event_type: "voice_drift_detected"') - 80)

  assert.match(voiceDriftBlock, /handleDomainEvent/)
  assert.doesNotMatch(voiceDriftBlock.slice(0, 500), /emitDomainEventWithClient/)
})

test("outcome learning has a durable Career Context schema slot", () => {
  const learning = read("lib/actions/outcome-learning.ts")
  const migration = read("supabase/migrations/20260527101000_add_user_profile_career_context.sql")

  assert.match(learning, /weak_archetypes/)
  assert.match(learning, /strong_archetypes/)
  assert.match(learning, /observations/)
  assert.match(migration, /career_context jsonb/)
})
