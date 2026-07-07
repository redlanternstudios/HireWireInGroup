/**
 * tests/onboarding-e2e.test.ts
 *
 * Real E2E for the SIGN-UP → ONBOARDING spine. No mocks, no direct DB writes:
 * every step uses the same routes/REST calls the browser uses.
 *
 * Why this exists: production signup silently sent no confirmation email
 * because the shared Supabase project's `rate_limit_email_sent` was throttled
 * to 2/hour and exhausted by co-tenant apps. Step 1 below is the regression
 * guard for that class of failure — it asserts Supabase actually accepts and
 * dispatches the confirmation email instead of returning over_email_send_rate_limit.
 *
 * Requirements (set in .env.test or shell):
 *   E2E_BASE_URL                  — running HireWire instance (default http://localhost:3000)
 *   NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key
 *   E2E_TEST_EMAIL / E2E_TEST_PASSWORD — a confirmed test account (for the
 *                                   authenticated onboarding steps)
 *
 * Run:  npm run test:e2e:onboarding   (or test:e2e:all)
 *
 * Steps:
 *   1. Sign-up dispatches a confirmation email (NOT rate-limited)  ← bug regression
 *   2. Onboarding "profile" step upserts user_profile (assert via REST)
 *   3. Onboarding "resume" step creates evidence via /api/resume/upload
 *   4. Completing onboarding unlocks the dashboard (no redirect loop)
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import fetch from "node-fetch"
import { signIn, apiRequest, testRunId, BASE_URL, type Session } from "./helpers/api-client.js"

function cleanEnv(v: string | undefined): string {
  return (v ?? "").trim().replace(/^['"]|['"]$/g, "").replace(/[\r\n\t]/g, "")
}

const SUPABASE_URL = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const ANON_KEY = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const TEST_EMAIL = cleanEnv(process.env.E2E_TEST_EMAIL)
const TEST_PASSWORD = cleanEnv(process.env.E2E_TEST_PASSWORD)

const RUN_ID = testRunId()

// A résumé with enough structure that the parser yields >= 1 evidence row.
const FIXTURE_RESUME = `
Jordan Rivers — Senior Product Manager (${RUN_ID})
jordan.${RUN_ID}@example.com

EXPERIENCE

Senior Product Manager, Northwind Labs (2020–2024)
- Owned the roadmap for an AI workflow platform used by 40k monthly users.
- Led quarterly prioritization and shipped 3 major releases, growing retention 18%.
- Ran discovery interviews with enterprise customers and synthesized findings into PRDs.

Product Manager, Acme SaaS (2017–2020)
- Launched a B2B analytics product end-to-end from 0 to 1.
- Partnered with engineering on sprint planning and OKRs.

SKILLS
Product strategy, SQL, roadmapping, user research, stakeholder management
`.trim()

describe("Sign-up → Onboarding spine (real API)", () => {
  let session: Session | null = null
  const createdEvidenceIds: string[] = []

  before(async () => {
    assert.ok(SUPABASE_URL && ANON_KEY, "NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are required")
    if (TEST_EMAIL && TEST_PASSWORD) {
      session = await signIn(TEST_EMAIL, TEST_PASSWORD)
    }
  })

  // -------------------------------------------------------------------------
  // Step 1 — the regression guard for the reported bug.
  // A fresh signup must be ACCEPTED and the confirmation email DISPATCHED,
  // not throttled. We use a throwaway address; the account is never confirmed,
  // so it cannot log in and needs no cleanup.
  // -------------------------------------------------------------------------
  it("dispatches a confirmation email on signup (not rate-limited)", async () => {
    const email = `hirewire+signup-${RUN_ID}@example.com`
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: `Aa1!${RUN_ID}xz`,
        // mirror app/(auth)/signup/page.tsx
        options: { email_redirect_to: "http://localhost:3000/auth/callback?redirect=/onboarding" },
      }),
    })
    const body = (await res.json()) as Record<string, unknown>

    assert.notEqual(res.status, 429, `signup was rate-limited: ${JSON.stringify(body)}`)
    assert.notEqual(
      body.error_code,
      "over_email_send_rate_limit",
      "email send is throttled — raise Supabase rate_limit_email_sent",
    )
    assert.ok(res.ok, `signup failed (${res.status}): ${JSON.stringify(body)}`)

    // With confirmations on, GoTrue returns a user with confirmation_sent_at set
    // once the email has been handed to SMTP. That timestamp is the proof of
    // dispatch — the exact signal that was missing when the bucket was drained.
    const sentAt =
      (body.confirmation_sent_at as string | undefined) ??
      ((body.user as Record<string, unknown> | undefined)?.confirmation_sent_at as string | undefined)
    assert.ok(sentAt, `no confirmation_sent_at on signup response: ${JSON.stringify(body)}`)
  })

  // -------------------------------------------------------------------------
  // Step 2 — onboarding "profile" step: exactly the user_profile upsert the
  // page performs, then read it back through RLS with the session token.
  // -------------------------------------------------------------------------
  it("persists the onboarding profile step (user_profile upsert)", async (t) => {
    if (!session) return t.skip("set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run authenticated steps")

    const fullName = `Onboarding Test ${RUN_ID}`
    // on_conflict=user_id mirrors the page's supabase.upsert(..., { onConflict: "user_id" }).
    // Without it PostgREST conflicts on the PK (id) and 409s when the row exists.
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/user_profile?on_conflict=user_id`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        user_id: session.userId,
        full_name: fullName,
        email: session.email,
        headline: `PM • ${RUN_ID}`,
        skills: ["product strategy", "roadmapping"],
      }),
    })
    assert.ok(upsert.ok, `user_profile upsert failed (${upsert.status}): ${await upsert.text()}`)

    const read = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profile?user_id=eq.${session.userId}&select=full_name,email`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${session.accessToken}` } },
    )
    const rows = (await read.json()) as Array<{ full_name: string; email: string }>
    assert.equal(rows.length, 1, "expected exactly one user_profile row for the user")
    assert.equal(rows[0].full_name, fullName, "profile full_name did not persist")
  })

  // -------------------------------------------------------------------------
  // Step 3 — onboarding "resume" step: POST /api/resume/upload (JSON body,
  // same route the page calls) and assert it created evidence.
  // -------------------------------------------------------------------------
  it("creates evidence from the onboarding resume step", async (t) => {
    if (!session) return t.skip("set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run authenticated steps")

    const res = await apiRequest<{
      inserted: number
      evidence?: Array<{ id: string; title: string }>
      error?: string
    }>(session, "/api/resume/upload", { method: "POST", body: { text: FIXTURE_RESUME } })

    // Resume parsing requires GROQ_API_KEY. If the env lacks it, this is an env
    // limitation, not a code defect — skip rather than fail (like the auth steps).
    if (res.status === 500 && /GROQ_API_KEY/i.test(res.body?.error ?? "")) {
      return t.skip("GROQ_API_KEY not configured — resume parse step needs it")
    }
    assert.equal(res.status, 200, `resume upload failed: ${JSON.stringify(res.body)}`)
    assert.ok(
      (res.body.inserted ?? 0) >= 1,
      `expected >= 1 evidence entry, got ${res.body.inserted}`,
    )
    for (const e of res.body.evidence ?? []) createdEvidenceIds.push(e.id)
  })

  // -------------------------------------------------------------------------
  // Step 4 — completing onboarding must UNLOCK the app. (dashboard)/layout.tsx
  // redirects any profile with onboarding_complete=false back to /onboarding,
  // and the column defaults to false — so if onboarding never flips it, every
  // user is bounced back forever. Assert the gate opens once the flag is set.
  // -------------------------------------------------------------------------
  it("completing onboarding unlocks the dashboard (no redirect loop)", async (t) => {
    if (!session) return t.skip("set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run authenticated steps")

    const cookie = session.cookies.map((c) => c.split(";")[0]).join("; ")

    // Set the completion flag exactly as the onboarding page's final step does.
    const patch = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profile?user_id=eq.${session.userId}`,
      {
        method: "PATCH",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ onboarding_complete: true }),
      },
    )
    assert.ok(patch.ok, `could not set onboarding_complete: ${patch.status}`)

    // The dashboard is a server component that redirect()s incomplete users.
    // With the flag set it must render instead of bouncing to /onboarding.
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    })
    const location = res.headers.get("location") ?? ""
    assert.ok(
      !location.includes("/onboarding"),
      `dashboard still redirects to onboarding after completion (status ${res.status}, location ${location})`,
    )
  })

  after(async () => {
    if (!session || createdEvidenceIds.length === 0) return
    for (const id of createdEvidenceIds) {
      await fetch(`${SUPABASE_URL}/rest/v1/evidence_library?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${session.accessToken}` },
      })
    }
  })
})
