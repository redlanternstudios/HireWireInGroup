import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emitDomainEventWithClient } from "@/lib/domain-events/emit-event"

const VALID_OUTCOMES = [
  "callback",
  "rejection",
  "ghosted",
  "interview_scheduled",
  "interview_completed",
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "application_withdrawn",
] as const

type OutcomeValue = typeof VALID_OUTCOMES[number]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const outcome = body.outcome as string
  if (!outcome || !VALID_OUTCOMES.includes(outcome as OutcomeValue)) {
    return NextResponse.json(
      { success: false, error: `Invalid outcome. Must be one of: ${VALID_OUTCOMES.join(", ")}` },
      { status: 400 }
    )
  }

  // Verify job belongs to user
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, intelligence, score, resume_strategy")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
  }

  // Extract intelligence context for learning
  const intel = job.intelligence as Record<string, unknown> | null
  const outcomeDate = (body.outcome_date as string | undefined) ?? new Date().toISOString()

  // Calculate days_to_response from job applied_at if available
  const { data: jobFull } = await supabase
    .from("jobs")
    .select("applied_at")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single()

  const appliedAt = jobFull?.applied_at
  const daysToResponse = appliedAt
    ? Math.round((new Date(outcomeDate).getTime() - new Date(appliedAt).getTime()) / 86400000)
    : null

  // Upsert outcome record
  const { data: outcomeRecord, error: upsertError } = await supabase
    .from("application_outcomes")
    .upsert({
      user_id: user.id,
      job_id: jobId,
      outcome: outcome as OutcomeValue,
      outcome_date: outcomeDate,
      days_to_response: daysToResponse,
      response_source: (body.response_source as string | undefined) ?? null,
      narrative_mode: intel?.narrative_mode as string | undefined ?? null,
      role_archetype: intel?.role_archetype as string | undefined ?? null,
      dominant_signal: intel?.dominant_signal as string | undefined ?? null,
      fit_score: job.score ?? null,
      generation_strategy: job.resume_strategy ?? null,
      salary_discussed: (body.salary_discussed as boolean | undefined) ?? false,
      salary_offered: (body.salary_offered as number | undefined) ?? null,
      interview_rounds: (body.interview_rounds as number | undefined) ?? null,
      notes: (body.notes as string | undefined) ?? null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,job_id",
    })
    .select()
    .single()

  if (upsertError) {
    console.error("[outcome] upsert failed:", upsertError)
    return NextResponse.json(
      { success: false, error: "Failed to save outcome" },
      { status: 500 }
    )
  }

  // Mirror outcome to jobs table for quick access
  const jobStatus = outcomeToJobStatus(outcome as OutcomeValue)
  await supabase
    .from("jobs")
    .update({
      outcome: outcome,
      outcome_date: outcomeDate,
      days_to_response: daysToResponse,
      ...(jobStatus ? { status: jobStatus } : {}),
    })
    .eq("id", jobId)
    .eq("user_id", user.id)

  // Emit domain event
  void emitDomainEventWithClient(supabase, {
    event_type: "outcome_updated",
    job_id: jobId,
    user_id: user.id,
    source: "user",
    payload: {
      outcome,
      role_archetype: intel?.role_archetype ?? null,
      narrative_mode: intel?.narrative_mode ?? null,
      days_to_response: daysToResponse,
    },
    invalidates: ["coach_state", "readiness"],
    recomputes: [],
    affected_routes: [`/jobs/${jobId}`, "/dashboard", "/analytics"],
    severity: "info",
    metadata: {},
  })

  return NextResponse.json({
    success: true,
    outcome_id: outcomeRecord.id,
    outcome,
    days_to_response: daysToResponse,
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("application_outcomes")
    .select("*")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, outcome: data ?? null })
}

// Map outcome to job status transition
function outcomeToJobStatus(outcome: OutcomeValue): string | null {
  switch (outcome) {
    case "callback":
    case "interview_scheduled":
    case "interview_completed":
      return "interviewing"
    case "offer_received":
    case "offer_accepted":
      return "offered"
    case "rejection":
      return "rejected"
    default:
      return null
  }
}
