import { loadEnvConfig } from "@next/env"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import assert from "node:assert/strict"
import { handleDomainEvent } from "../lib/domain-events"

loadEnvConfig(process.cwd())

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
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

type Receipt = Record<string, unknown>

function log(step: string, receipt?: Receipt) {
  console.log(receipt ? `${step} ${JSON.stringify(receipt, null, 2)}` : step)
}

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
  assert.ok(created.data.user?.id, "created user id missing")
  return created.data.user.id
}

async function sessionCookie() {
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
  assert.ok(signedIn.data.user, "password login did not return a user")
  return jar.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
}

async function post(path: string, body: Record<string, unknown>, cookie: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let json: Record<string, any>
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  log(`HTTP ${path}`, { status: response.status, body: json })
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${JSON.stringify(json)}`)
  }
  return json
}

async function seedUserState(userId: string) {
  await admin
    .from("jobs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("company_name", "E2E Labs")
    .eq("role_title", "Lead Product Manager")
    .is("deleted_at", null)

  await admin.from("users").upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      plan_type: "pro",
      generations_this_month: 0,
      usage_reset_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  const profile = await admin.from("user_profile").upsert(
    {
      user_id: userId,
      email: TEST_EMAIL,
      full_name: "Johnny Testone",
      title: "Lead Product Manager",
      headline: "Lead Product Manager for SaaS and AI workflow products",
      location: "Austin, TX",
      summary:
        "Product leader who builds AI-enabled SaaS workflows, leads discovery, partners with engineering, and measures adoption outcomes.",
      skills: [
        "Product strategy",
        "SaaS",
        "AI workflows",
        "Roadmapping",
        "Stakeholder management",
        "Experimentation",
        "Analytics",
        "SQL",
        "Figma",
        "Jira",
      ],
      certifications: ["Pragmatic Product Management"],
      experience: [
        {
          title: "Senior Product Manager",
          company: "SignalWorks",
          start_date: "2021",
          end_date: "2025",
          description: "Led AI workflow and analytics products for B2B SaaS customers.",
          bullets: [
            "Launched AI workflow assistant used by enterprise operations teams.",
            "Increased activation by 18% through onboarding experiments.",
            "Partnered with engineering and design on roadmap prioritization.",
          ],
        },
      ],
      education: [{ degree: "MBA", school: "University of Texas", year: "2020" }],
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )
  if (profile.error) throw profile.error

  const stamp = Date.now()
  const evidence = await admin
    .from("evidence_library")
    .insert([
      {
        user_id: userId,
        source_title: `AI Workflow Assistant Launch ${stamp}`,
        source_type: "project",
        confidence_level: "high",
        is_user_approved: true,
        is_active: true,
        visibility_status: "active",
        priority_rank: 10,
        role_name: "Senior Product Manager",
        company_name: "SignalWorks",
        date_range: "2023-2024",
        responsibilities: [
          "Led product discovery and roadmap for an AI workflow assistant.",
          "Partnered with engineering and design to ship enterprise-ready workflow features.",
          "Aligned sales, customer success, design, and engineering around roadmap tradeoffs.",
        ],
        tools_used: ["OpenAI", "Figma", "Jira", "SQL", "Amplitude"],
        outcomes: [
          "Launched assistant to enterprise beta customers.",
          "Improved onboarding activation by 18%.",
        ],
        approved_keywords: ["AI workflows", "SaaS", "roadmap", "enterprise", "activation"],
        approved_achievement_bullets: [
          "Launched an AI workflow assistant for enterprise SaaS customers, improving onboarding activation by 18%.",
        ],
        proof_snippet:
          "Launched an AI workflow assistant for enterprise SaaS customers and improved onboarding activation by 18%.",
      },
      {
        user_id: userId,
        source_title: `Roadmap Prioritization Operating Rhythm ${stamp}`,
        source_type: "work_experience",
        confidence_level: "high",
        is_user_approved: true,
        is_active: true,
        visibility_status: "active",
        priority_rank: 9,
        role_name: "Senior Product Manager",
        company_name: "SignalWorks",
        date_range: "2021-2025",
        responsibilities: [
          "Owned quarterly roadmap planning with engineering, design, sales, and customer success.",
          "Used product analytics and customer interviews to prioritize bets.",
        ],
        tools_used: ["Jira", "Amplitude", "SQL"],
        outcomes: ["Reduced stakeholder escalation by aligning roadmap decisions to clear evidence."],
        approved_keywords: ["roadmap", "stakeholder management", "analytics", "customer interviews"],
        approved_achievement_bullets: [
          "Owned quarterly roadmap planning across engineering, design, sales, and customer success using analytics and customer interviews.",
        ],
        proof_snippet:
          "Owned quarterly roadmap planning and used analytics/customer interviews to prioritize roadmap bets.",
      },
    ])
    .select("id")
  if (evidence.error) throw evidence.error
  assert.ok((evidence.data ?? []).length >= 2, "evidence seed failed")

  log("Seed", {
    user_id: userId,
    evidence_ids: evidence.data?.map((item) => item.id),
  })
}

async function fetchJob(jobId: string, userId: string) {
  const { data, error } = await admin
    .from("jobs")
    .select(
      "id,user_id,status,role_title,company_name,score,fit,score_gaps,evidence_map,gap_clarifications,gaps_addressed,generated_resume,generated_cover_letter,generation_status,generation_error,quality_passed,applied_at",
    )
    .eq("id", jobId)
    .eq("user_id", userId)
    .single()
  if (error) throw error
  return data
}

async function fetchJobAnalysis(jobId: string, userId: string) {
  const { data, error } = await admin
    .from("job_analyses")
    .select("id,job_id,user_id,qualifications_required,responsibilities,known_gaps,matched_skills")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  assert.ok(data, "job_analyses row missing")
  return data
}

async function main() {
  log("HireWire up/downstream E2E starting", { base_url: BASE_URL, email: TEST_EMAIL })
  const userId = await ensureUser()
  await seedUserState(userId)
  const cookie = await sessionCookie()

  const runStamp = Date.now()
  const jobDescription = `
E2E Labs ${runStamp} is hiring a Lead Product Manager ${runStamp} to own AI-enabled SaaS workflow products.
Responsibilities include defining product strategy, leading roadmap prioritization,
partnering with engineering and design, using analytics and customer discovery,
managing stakeholder alignment, and launching enterprise-grade workflow capabilities.
Required qualifications: 7+ years in product management, B2B SaaS experience,
AI or automation product experience, roadmap ownership, product analytics,
cross-functional leadership, excellent communication, and Certified Kubernetes Administrator.
Preferred qualifications: MBA, consulting or enterprise customer experience,
SQL or analytics fluency. Unique run ${runStamp}.
`

  const analyzed = await post("/api/analyze", { job_description: jobDescription }, cookie)
  const jobId = analyzed.job_id ?? analyzed.job?.id
  assert.ok(jobId, "analyze did not return a job id")

  const analyzedJob = await fetchJob(jobId, userId)
  assert.equal(analyzedJob.user_id, userId, "job tenant scope mismatch")
  assert.ok(analyzedJob.role_title, "job role_title missing")
  assert.ok(analyzedJob.company_name, "job company_name missing")
  const analysis = await fetchJobAnalysis(jobId, userId)
  assert.ok(Array.isArray(analysis.qualifications_required), "qualifications_required missing")
  assert.ok(Array.isArray(analysis.responsibilities), "responsibilities missing")
  assert.equal(typeof analyzedJob.score, "number", "job score did not backfill")
  assert.ok(analyzedJob.evidence_map, "evidence_map did not backfill")
  log("Analyze DB", {
    job_id: jobId,
    score: analyzedJob.score,
    fit: analyzedJob.fit,
    score_gaps: analyzedJob.score_gaps,
  })

  const addedEvidence = await admin
    .from("evidence_library")
    .insert({
      user_id: userId,
      source_title: `Certified Kubernetes Administrator ${Date.now()}`,
      source_type: "certification",
      confidence_level: "high",
      is_user_approved: true,
      is_active: true,
      visibility_status: "active",
      priority_rank: 20,
      proof_snippet: "Certified Kubernetes Administrator credential.",
      approved_keywords: ["Certified Kubernetes Administrator", "Kubernetes"],
    })
    .select("id")
    .single()
  if (addedEvidence.error) throw addedEvidence.error

  await handleDomainEvent({
    supabase: admin as any,
    event_type: "evidence_added",
    job_id: null,
    user_id: userId,
    source: "evidence_action",
    payload: { evidence_id: addedEvidence.data.id, e2e: true },
  })

  const evidenceRecomputedJob = await fetchJob(jobId, userId)
  const recomputedMap = evidenceRecomputedJob.evidence_map as Record<string, any> | null
  assert.ok(
    Array.isArray(recomputedMap?.requirement_matches),
    "evidence_added did not recompute requirement_matches",
  )
  assert.ok(
    Array.isArray(recomputedMap?.capability_packets),
    "evidence_added did not rebuild capability_packets",
  )
  assert.ok(
    recomputedMap?.capability_packets?.every((packet: Record<string, any>) =>
      typeof packet.packet_id === "string" &&
      typeof packet.requirement === "string" &&
      Array.isArray(packet.matchedEvidenceIds) &&
      Array.isArray(packet.riskFlags) &&
      typeof packet.matchStrength === "string" &&
      typeof packet.evidenceStrength === "string"
    ),
    "capability_packets are missing required trace fields",
  )
  assert.equal(
    recomputedMap?._coach_step?.status,
    "required",
    "evidence recompute dropped existing coach metadata",
  )
  log("Evidence propagation DB", {
    evidence_id: addedEvidence.data.id,
    requirement_matches: recomputedMap?.requirement_matches?.length,
    capability_packets: recomputedMap?.capability_packets?.length,
    coach_step: recomputedMap?._coach_step,
  })

  const blockedGeneration = await fetch(`${BASE_URL}/api/generate-documents`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ job_id: jobId }),
  })
  const blockedBody = await blockedGeneration.json()
  log("Blocked generation check", { status: blockedGeneration.status, body: blockedBody })
  assert.notEqual(blockedGeneration.status, 200, "generation bypassed coach/readiness gate")

  const coach = await post(`/api/jobs/${jobId}/coach-step`, { action: "complete" }, cookie)
  assert.equal(coach.success, true, "coach completion failed")

  const generated = await post("/api/generate-documents", { job_id: jobId }, cookie)
  assert.equal(generated.success, true, "generation did not return success")

  const generatedJob = await fetchJob(jobId, userId)
  assert.ok((generatedJob.generated_resume ?? "").length > 100, "generated_resume not persisted")
  assert.ok((generatedJob.generated_cover_letter ?? "").length > 100, "generated_cover_letter not persisted")
  assert.equal(generatedJob.generation_error, null, "generation_error should be null after success")
  assert.equal(
    (generatedJob.evidence_map as Record<string, any> | null)?._coach_step?.status,
    "completed",
    "coach metadata was lost during downstream readiness recompute",
  )
  const generatedMap = generatedJob.evidence_map as Record<string, any> | null
  const bulletTrace = generatedMap?.bullet_provenance
  assert.ok(Array.isArray(bulletTrace), "bullet provenance missing")
  assert.ok(bulletTrace.length > 0, "bullet provenance empty")
  assert.ok(
    bulletTrace.every((trace: Record<string, any>) =>
      typeof trace.source_packet_id === "string" &&
      typeof trace.matched_requirement_text === "string" &&
      Array.isArray(trace.risk_flags) &&
      trace.truth_serum &&
      typeof trace.truth_serum.score === "number"
    ),
    "every generated bullet must have packet trace and TruthSerum audit",
  )
  log("Generation DB", {
    status: generatedJob.status,
    generation_status: generatedJob.generation_status,
    quality_passed: generatedJob.quality_passed,
    resume_chars: generatedJob.generated_resume?.length,
    cover_letter_chars: generatedJob.generated_cover_letter?.length,
    traced_bullets: bulletTrace.length,
  })

  log("HireWire up/downstream E2E passed", {
    user_id: userId,
    job_id: jobId,
    final_status: generatedJob.status,
    note:
      "This API/DB harness covers analyze -> evidence/readiness -> coach -> generate. Apply is a UI server-action path and should be covered by a browser test.",
  })
}

main().catch((error) => {
  console.error("HireWire up/downstream E2E failed")
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
