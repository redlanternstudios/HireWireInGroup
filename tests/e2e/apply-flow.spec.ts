import { expect, test } from "@playwright/test"
import { loadEnvConfig } from "@next/env"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "Johnnytestone@yopmail.com"
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "TestPass123!"

function cleanEnv(value: string | undefined) {
  return value?.replace(/[\u2028\u2029]/g, "").trim()
}

function requireEnv(name: string) {
  const value = cleanEnv(process.env[name])
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureUser() {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listed.error) throw listed.error
  const existing = listed.data.users.find(
    (user) => user.email?.toLowerCase() === TEST_EMAIL.toLowerCase(),
  )
  if (existing) return existing.id

  const created = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (created.error) throw created.error
  if (!created.data.user?.id) throw new Error("created user missing id")
  return created.data.user.id
}

async function authCookies() {
  const jar: { name: string; value: string }[] = []
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return jar
      },
      setAll(cookies) {
        for (const cookie of cookies) {
          const index = jar.findIndex((item) => item.name === cookie.name)
          if (index >= 0) jar[index] = cookie
          else jar.push(cookie)
        }
      },
    },
  })

  const signedIn = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signedIn.error) throw signedIn.error
  return jar.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  }))
}

async function seedReadyJob(userId: string) {
  const stamp = Date.now()

  const previous = await admin
    .from("jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("company_name", "E2E Apply Co")
    .is("deleted_at", null)
  if (previous.error) throw previous.error

  const previousIds = (previous.data ?? []).map((job) => job.id)
  if (previousIds.length > 0) {
    await admin.from("applications").delete().in("job_id", previousIds)
    await admin
      .from("jobs")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", previousIds)
  }

  const evidence = await admin
    .from("evidence_library")
    .insert({
      user_id: userId,
      source_title: `E2E Apply Readiness Evidence ${stamp}`,
      source_type: "project",
      confidence_level: "high",
      is_user_approved: true,
      is_active: true,
      visibility_status: "active",
      proof_snippet: "Owned roadmap and shipped an evidence-backed product package.",
    })
    .select("id")
    .single()
  if (evidence.error) throw evidence.error

  const job = await admin
    .from("jobs")
    .insert({
      user_id: userId,
      role_title: `E2E Apply Ready Role ${stamp}`,
      company_name: "E2E Apply Co",
      job_url: `manual://e2e-apply/${stamp}`,
      source: "OTHER",
      status: "ready",
      score: 92,
      fit: "HIGH",
      generated_resume: "Evidence-backed generated resume for apply E2E.",
      generated_cover_letter: "Evidence-backed generated cover letter for apply E2E.",
      quality_passed: true,
      generation_status: "ready",
      generation_timestamp: new Date().toISOString(),
      evidence_map: {
        matching_complete: true,
        completed_at: new Date().toISOString(),
        requirement_matches: [
          {
            requirement_id: "roadmap_ownership",
            requirement_text: "Roadmap ownership",
            normalized_requirement: "roadmap ownership",
            priority: "required",
            status: "met",
            matched_evidence_ids: [evidence.data.id],
            matched_evidence_titles: [`E2E Apply Readiness Evidence ${stamp}`],
            evidence_types: ["project"],
            confidence: "high",
            match_method: "manual",
            reasoning: "Seeded E2E ready evidence.",
          },
        ],
        coverage_summary: {
          required_total: 1,
          required_met: 1,
          required_partial: 0,
          required_gaps: 0,
          preferred_total: 0,
          preferred_met: 0,
          keyword_total: 0,
          keyword_met: 0,
        },
        capability_packets: [
          {
            packet_id: "pkt_roadmap_ownership",
            requirement: "Roadmap ownership",
            normalized: "roadmap ownership",
            priority: "required",
            matchedEvidenceIds: [evidence.data.id],
            matchedEvidenceTitles: [`E2E Apply Readiness Evidence ${stamp}`],
            proofSnippets: ["Owned roadmap and shipped an evidence-backed product package."],
            systems: [],
            tools: [],
            outcomes: ["Shipped an evidence-backed product package."],
            responsibilities: ["Owned roadmap."],
            companies: ["E2E Apply Co"],
            roles: ["Product Manager"],
            matchStrength: "strong",
            matchScore: 90,
            matchReason: "Seeded E2E ready evidence.",
            evidenceStrength: "high",
            riskFlags: [],
            allowedUsage: "resume_allowed",
            whyIncluded: "Required requirement matched to seeded E2E evidence.",
          },
        ],
        gap_summary: [],
        _coach_step: {
          status: "completed",
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      },
    })
    .select("id, role_title")
    .single()
  if (job.error) throw job.error

  return job.data
}

test("ready-to-apply Mark as Applied creates application and updates downstream UI", async ({
  context,
  page,
}) => {
  const userId = await ensureUser()
  const job = await seedReadyJob(userId)
  const titlePattern = /E2E Apply Ready Role/i
  await context.addCookies(await authCookies())

  await page.goto("/ready-to-apply")
  await expect(page).toHaveURL(/ready-to-apply/)
  await expect(page.getByText(titlePattern).first()).toBeVisible()

  const row = page.locator(".hw-card", { hasText: titlePattern }).first()
  await row.getByRole("button", { name: /mark as applied/i }).click()
  await page.getByRole("button", { name: /confirm applied/i }).click()

  await page.goto("/applications")
  await expect(page).toHaveURL(/applications/)
  await expect(
    page.getByRole("heading", { name: /^Applications$/i, level: 1 }),
  ).toBeVisible()
  await expect(page.getByText("Applied").first()).toBeVisible()

  const { data: applicationRows, error: applicationError } = await admin
    .from("applications")
    .select("id, applied_at, status")
    .eq("job_id", job.id)
    .eq("user_id", userId)
  if (applicationError) throw applicationError
  expect(applicationRows).toHaveLength(1)
  expect(applicationRows[0].applied_at).toBeTruthy()

  const { data: updatedJob, error: jobError } = await admin
    .from("jobs")
    .select("status, applied_at")
    .eq("id", job.id)
    .eq("user_id", userId)
    .single()
  if (jobError) throw jobError
  expect(updatedJob.status).toBe("applied")
  expect(updatedJob.applied_at).toBeTruthy()
})
