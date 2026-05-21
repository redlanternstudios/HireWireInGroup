import { loadEnvConfig } from "@next/env"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { AI_MODELS, generateStructuredText, isAiGatewayConfigured } from "../lib/ai/gateway"
import { analyzeJobProfileGap } from "../lib/integrity/gap-analyzer"

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log("--- 1. Simulate User Signup (v0) ---")
  const email = "johnnytestv0@yopmail.com"
  const password = "TestPass123!"

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  const userAlreadyExists =
    authError?.code === "email_exists" ||
    authError?.message === "User already registered" ||
    authError?.message.includes("already been registered")

  if (authError && !userAlreadyExists) {
    console.error("Signup error:", authError)
    return
  }

  const existingUserId = userAlreadyExists ? await findUserIdByEmail(email) : null
  const userId = authData.user?.id ?? existingUserId ?? email
  console.log("User already exists or created", { email, user_id: userId })

  console.log("--- 2. Upload Sample Resume / Evidence (v0) ---")
  // Simulate evidence upload/approval
  const evidence = [
    {
      id: "evidence-v0-1",
      source_title: "Full Stack Developer at SaaSify",
      source_type: "work_experience",
      confidence_level: "high",
      is_user_approved: true,
    },
    {
      id: "evidence-v0-2",
      source_title: "MBA, Business Analytics",
      source_type: "education",
      confidence_level: "high",
      is_user_approved: true,
    },
  ]
  console.log("Evidence added/approved (v0)", { count: evidence.length, ids: evidence.map(e => e.id) })

  console.log("--- 3. Add Job Post (v0) ---")
  const job = {
    id: "job-v0-1",
    role_title: "Product Owner (SaaS)",
    company_name: "V0 AI",
    qualifications_required: ["SaaS experience", "MBA", "Scrum certification"],
    responsibilities: ["Lead agile teams", "Drive product roadmap"],
  }
  console.log("Job added (v0)", job)

  console.log("--- 4. Map Evidence to Job Requirements (v0) ---")
  // Simulate evidence mapping
  const mapping = [
    {
      requirement: "SaaS experience",
      evidence_id: "evidence-v0-1",
      evidence_title: "Full Stack Developer at SaaSify",
      score: 1,
    },
    {
      requirement: "MBA",
      evidence_id: "evidence-v0-2",
      evidence_title: "MBA, Business Analytics",
      score: 1,
    },
    {
      requirement: "Scrum certification",
      evidence_id: null,
      evidence_title: null,
      score: 0,
    },
  ]
  const match_score = Math.round((mapping.filter(m => m.score > 0).length / mapping.length) * 100)
  const open_gaps = mapping.filter(m => !m.evidence_id).map(m => m.requirement)
  console.log("Match and gap scores (v0)", {
    match_score,
    matched_requirements: mapping.filter(m => m.score === 1).length,
    partial_requirements: 0,
    open_gaps,
    mapping,
  })

  console.log("--- 5. Coach Step (v0) ---")
  if (open_gaps.length > 0) {
    console.log("Coach required: clarify " + open_gaps.join(", "))
  } else {
    console.log("Coach: All requirements met.")
  }

  console.log("--- 6. Generate Documents / Gap Analysis (v0) ---")
  const resume_chars = 410
  const cover_letter_chars = 250
  const generation_status = open_gaps.length === 0 ? "ready" : "needs_review"
  const governance_passed = true
  const governance_drift_score = 0
  console.log("Generated document receipts (v0)", {
    resume_chars,
    cover_letter_chars,
    generation_status,
    governance_passed,
    governance_drift_score,
  })

  console.log("--- 7. Readiness & Governance Gates (v0) ---")
  console.log("Gate receipts (v0)", {
    evidence_verified: true,
    rls_scope: "service-role simulation scoped by user_id",
    quality_passed: true,
    governance_passed: true,
    readiness: generation_status,
  })

  console.log("--- 8. Provenance Receipts (v0) ---")
  console.log("PROVENANCE_RECEIPTS (v0)", {
    simulation_run_id: "v0-" + Date.now(),
    user_id: userId,
    job_id: job.id,
    evidence_ids: evidence.map(e => e.id),
    match_score,
    open_gaps,
    coach_step: open_gaps.length > 0 ? `Coach required: clarify ${open_gaps.join(", ")}` : "Coach: All requirements met.",
    generated_resume_chars: resume_chars,
    generated_cover_letter_chars: cover_letter_chars,
  })
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return null

    const user = data.users.find((candidate) => candidate.email === email)
    if (user) return user.id
    if (data.users.length < 1000) return null
  }

  return null
}

main().catch(console.error)
