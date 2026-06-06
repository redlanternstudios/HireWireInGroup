import type { createClient } from "@/lib/supabase/server"
import { normalizeJobStatus } from "@/lib/job-lifecycle"
import { recordRunStep } from "@/lib/logs/runLedger"
import { createJobFlowContext } from "@/lib/context/job-flow"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>
type RunStep = {
  step: string
  status: "started" | "success" | "error" | "skipped"
  summary: string
  error?: string
}

export interface RunJobFlowInput {
  supabase: ServerSupabase
  userId: string
  jobId: string
}

export interface RunJobFlowResult {
  success: boolean
  jobId: string
  correlationId: string
  steps: RunStep[]
  generation?: {
    attempted: boolean
    success: boolean
    error?: string | null
    strategy?: string
    quality_passed?: boolean
  }
}

export async function runJobFlow(input: RunJobFlowInput): Promise<RunJobFlowResult> {
  const { supabase, userId, jobId } = input
  const steps: RunStep[] = []
  
  // Create execution context for this flow
  const ctx = createJobFlowContext({ userId, jobId })

  const addStep = async (
    step: string,
    status: RunStep["status"],
    summary: string,
    error?: string
  ) => {
    const entry: RunStep = { step, status, summary, ...(error ? { error } : {}) }
    steps.push(entry)
    await recordRunStep(supabase, {
      jobId,
      userId,
      step,
      status,
      summary,
      errorDetails: error,
    })
  }

  try {
    await addStep("intake", "success", "Job accepted for orchestration")

    // Only select columns that exist in the jobs table
    const { data: existingJob } = await supabase
      .from("jobs")
      .select("status")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!existingJob) {
      await addStep("load_job", "error", "Job not found for current user", "not_found")
      return { success: false, jobId, correlationId: ctx.correlationId, steps }
    }

    const currentStatus = normalizeJobStatus(existingJob.status)
    if (currentStatus === "queued" || currentStatus === "draft") {
      await supabase
        .from("jobs")
        .update({ status: "analyzing" })
        .eq("id", jobId)
        .eq("user_id", userId)
      await addStep("analysis", "started", "Analysis step started")
      await addStep("analysis", "success", "Job status updated for analysis")
    } else {
      await addStep("analysis", "skipped", "Analysis already completed")
    }

    await addStep("generate_documents", "skipped", "Document generation waits for readiness and user action")

    return {
      success: true,
      jobId,
      correlationId: ctx.correlationId,
      steps,
      generation: {
        attempted: false,
        success: false,
        error: null,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Run flow failed"
    await supabase
      .from("jobs")
      .update({ status: "error" })
      .eq("id", jobId)
      .eq("user_id", userId)

    await addStep("flow", "error", "Orchestration failed", errorMessage)

    return {
      success: false,
      jobId,
      correlationId: ctx.correlationId,
      steps,
      generation: {
        attempted: false,
        success: false,
        error: errorMessage,
      },
    }
  }
}
