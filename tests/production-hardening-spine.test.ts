import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"

function read(path: string) {
  return readFileSync(path, "utf8")
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    return stat.isDirectory() ? filesUnder(fullPath) : [fullPath]
  })
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

test("Before You Apply saves and reads rich fit intelligence", () => {
  const analyzeCore = read("lib/analyze/analyze-job-core.ts")
  const jobPage = read("app/(dashboard)/jobs/[id]/page.tsx")
  const component = read("components/readiness-review.tsx")

  assert.match(analyzeCore, /detectGaps/)
  assert.match(analyzeCore, /strengths_json:\s*explainableFit\.strengths/)
  assert.match(analyzeCore, /gaps_json:\s*gapAnalysis\.gaps/)
  assert.match(jobPage, /strengths_json,\s*gaps_json/)
  assert.match(jobPage, /Array\.isArray\(analysis\?\.strengths_json\)/)
  assert.match(jobPage, /Array\.isArray\(analysis\?\.gaps_json\)/)
  assert.match(component, /fallbackMatchedSkills/)
  assert.match(component, /fallbackKnownGaps/)
})

test("API routes use requireUser instead of raw getUser", () => {
  const apiRoutes = filesUnder("app/api").filter((file) => file.endsWith("route.ts"))
  const offenders = apiRoutes.filter((file) => read(file).includes("supabase.auth.getUser("))

  assert.deepEqual(offenders, [])
})

test("analyze route fails fast when AI is not configured", () => {
  const route = read("app/api/analyze/route.ts")
  const gateway = read("lib/ai/gateway.ts")

  assert.match(route, /isAnthropicConfigured/)
  assert.match(route, /AI_GATEWAY_UNCONFIGURED_MESSAGE/)
  assert.match(route, /AiGatewayConfigurationError/)
  assert.match(route, /ai_gateway_not_configured/)
  assert.match(route, /status:\s*503/)
  assert.match(gateway, /isPlaceholderApiKey/)
  assert.ok(
    route.indexOf("isAnthropicConfigured") < route.indexOf("analyzeJobCore("),
    "AI configuration check must happen before analyzeJobCore is invoked",
  )
})
