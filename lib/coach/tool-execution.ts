/**
 * lib/coach/tool-execution.ts
 *
 * Tool execution implementations for the agentic coach.
 *
 * Every tool:
 *   1. Validates user ownership
 *   2. Performs mutation
 *   3. Emits domain event
 *   4. Returns result with undo info
 *
 * All execution happens through server actions to ensure security.
 */

"use server"

import { requireUser } from "@/lib/supabase/require-user"
import { handleDomainEvent } from "@/lib/domain-events/handle-event"
import { mapConfirmedEvidenceToRequirement } from "@/lib/evidence/mapConfirmedEvidenceToRequirement"
import { validateCoachAnswer } from "@/lib/coach/claim-validator"
import type { ToolCallResult, ToolExecutionContext } from "./tools"
import { revalidatePath } from "next/cache"
import {
  asCanonicalEvidenceMap,
  emitCoachEvent,
  guardedCoachStepUpdate,
  loadEvidenceRows,
  upsertProveFitDecision,
  withUpdatedRequirementMatches,
} from "./coach-step-helpers"

// ─── Evidence CRUD ──────────────────────────────────────────────────────────

interface CreateEvidenceParams {
  title: string
  description: string
  skills_demonstrated: string[]
  company_name?: string
  source_type?: "work_experience" | "project" | "achievement" | "certification" | "portfolio_entry" | "shipped_product" | "open_source"
  outcomes?: string[]
}

export async function executeCreateEvidence(
  params: CreateEvidenceParams,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    // Create evidence entry
    const { data: evidence, error } = await supabase
      .from("evidence_library")
      .insert({
        user_id: userId,
        source_title: params.title,
        proof_snippet: params.description,
        tools_used: params.skills_demonstrated,
        company_name: params.company_name,
        source_type: params.source_type || "work_experience",
        outcomes: params.outcomes || [],
        is_user_approved: true,
        confidence_level: "medium",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Emit domain event
    await handleDomainEvent({
      supabase,
      event_type: "evidence_added",
      job_id: context.jobId || null,
      user_id: userId,
      source: "coach_tool",
      payload: {
        evidence_id: evidence.id,
        title: evidence.source_title,
        skills: params.skills_demonstrated,
        source: "coach_tool",
        session_id: context.sessionId,
      },
    })

    revalidatePath("/evidence")
    if (context.jobId) {
      revalidatePath(`/jobs/${context.jobId}/evidence-match`)
    }

    return {
      success: true,
      data: {
        id: evidence.id,
        title: evidence.source_title,
      },
      undoable: true,
      undoAction: "deleteEvidence",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create evidence",
    }
  }
}

interface UpdateEvidenceParams {
  evidence_id: string
  updates: {
    title?: string
    description?: string
    skills_demonstrated?: string[]
    outcomes?: string[]
  }
}

export async function executeUpdateEvidence(
  params: UpdateEvidenceParams,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    // Verify ownership
    const { data: existing } = await supabase
      .from("evidence_library")
      .select("id, user_id")
      .eq("id", params.evidence_id)
      .single()

    if (!existing || existing.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Update evidence
    const { data: updated, error } = await supabase
      .from("evidence_library")
      .update({
        ...(params.updates.title ? { source_title: params.updates.title } : {}),
        ...(params.updates.description ? { proof_snippet: params.updates.description } : {}),
        ...(params.updates.skills_demonstrated ? { tools_used: params.updates.skills_demonstrated } : {}),
        ...(params.updates.outcomes ? { outcomes: params.updates.outcomes } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.evidence_id)
      .select()
      .single()

    if (error) throw error

    // Emit domain event
    await handleDomainEvent({
      supabase,
      event_type: "evidence_updated",
      job_id: context.jobId || null,
      user_id: userId,
      source: "coach_tool",
      payload: {
        evidence_id: params.evidence_id,
        changes: params.updates,
        session_id: context.sessionId,
      },
    })

    revalidatePath("/evidence")
    if (context.jobId) {
      revalidatePath(`/jobs/${context.jobId}/evidence-match`)
    }

    return {
      success: true,
      data: { id: updated.id, title: updated.source_title },
      undoable: true,
      undoAction: "updateEvidence",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update evidence",
    }
  }
}

export async function executeDeleteEvidence(
  params: { evidence_id: string; reason?: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    if (!context.confirmed) {
      return {
        success: false,
        needsConfirmation: true,
        confirmationPrompt: "Delete this evidence entry? This action cannot be undone.",
      }
    }

    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    // Verify ownership
    const { data: existing } = await supabase
      .from("evidence_library")
      .select("id, user_id, source_title")
      .eq("id", params.evidence_id)
      .single()

    if (!existing || existing.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Soft delete
    const { error } = await supabase
      .from("evidence_library")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.evidence_id)

    if (error) throw error

    // Find affected jobs and unmap
    const { data: affectedJobs } = await supabase
      .from("jobs")
      .select("id, evidence_map")
      .eq("user_id", userId)

    for (const job of affectedJobs || []) {
      if (!job.evidence_map) continue
      const map = job.evidence_map

      let changed = false
      if (map.requirement_matches && Array.isArray(map.requirement_matches)) {
        for (const req of map.requirement_matches) {
          if (req.matched_evidence_ids?.includes(params.evidence_id)) {
            req.matched_evidence_ids = req.matched_evidence_ids.filter(
              (id: string) => id !== params.evidence_id
            )
            if (req.matched_evidence_ids.length === 0 && req.status !== "gap") {
              req.status = "gap"
            }
            changed = true
          }
        }
      }

      if (changed) {
        await supabase.from("jobs").update({ evidence_map: map }).eq("id", job.id)
      }
    }

    // Emit domain event
    await handleDomainEvent({
      supabase,
      event_type: "evidence_deleted",
      job_id: context.jobId || null,
      user_id: userId,
      source: "coach_tool",
      payload: {
        evidence_id: params.evidence_id,
        title: existing.source_title,
        reason: params.reason,
        affected_jobs: affectedJobs?.length || 0,
        session_id: context.sessionId,
      },
    })

    revalidatePath("/evidence")
    if (context.jobId) {
      revalidatePath(`/jobs/${context.jobId}/evidence-match`)
    }

    return {
      success: true,
      data: { deleted: true, affected_jobs: affectedJobs?.length || 0 },
      undoable: true,
      undoAction: "restoreEvidence",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete evidence",
    }
  }
}

// ─── Evidence Mapping ───────────────────────────────────────────────────────

interface MapEvidenceParams {
  job_id: string
  requirement_id: string
  evidence_id: string
  confidence?: "high" | "medium" | "low"
}

export async function executeMapEvidenceToRequirement(
  params: MapEvidenceParams,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id, evidence_map")
      .eq("id", params.job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single()

    if (jobError || !job) {
      return { success: false, error: "Job not found" }
    }

    const evidenceMap = job.evidence_map as { requirement_matches?: Array<Record<string, unknown>> } | null
    const previousMatch = evidenceMap?.requirement_matches?.find(
      requirement => requirement.requirement_id === params.requirement_id
    )

    if (!previousMatch) {
      return { success: false, error: "Requirement not found in job" }
    }

    const { data: evidence, error: evidenceError } = await supabase
      .from("evidence_library")
      .select("id, source_title, source_type")
      .eq("id", params.evidence_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle()

    if (evidenceError || !evidence) {
      return { success: false, error: "Evidence not found" }
    }

    const prevStatus = String(previousMatch.status ?? "unknown")
    const mappingResult = await mapConfirmedEvidenceToRequirement({
      supabase,
      userId,
      jobId: params.job_id,
      sessionId: context.sessionId,
      requirementId: params.requirement_id,
      evidenceId: params.evidence_id,
      evidenceTitle: evidence.source_title,
      evidenceType: evidence.source_type,
    })
    const updatedMatch = mappingResult.evidenceMap.requirement_matches.find(
      (requirement) => requirement.requirement_id === params.requirement_id
    )

    // Emit domain event
    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        requirement_id: params.requirement_id,
        evidence_id: params.evidence_id,
        prev_status: mappingResult.prevStatus ?? prevStatus,
        new_status: mappingResult.newStatus,
        confidence: params.confidence,
        session_id: context.sessionId,
      },
    })

    revalidatePath(`/jobs/${params.job_id}`)
    revalidatePath(`/jobs/${params.job_id}/evidence-match`)

    return {
      success: true,
      data: {
        requirement_id: params.requirement_id,
        status: updatedMatch?.status ?? "partial",
      },
      undoable: true,
      undoAction: "unmapEvidence",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to map evidence",
    }
  }
}

export async function executeUnmapEvidence(
  params: { job_id: string; requirement_id: string; evidence_id: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    const { data: job } = await supabase
      .from("jobs")
      .select("id, user_id, evidence_map, updated_at")
      .eq("id", params.job_id)
      .single()

    if (!job || job.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    const evidenceMap = job.evidence_map || { requirement_matches: [] }
    const req = (evidenceMap.requirement_matches || []).find(
      (r: any) => r.requirement_id === params.requirement_id
    )

    if (!req) return { success: false, error: "Requirement not found" }

    req.matched_evidence_ids = (req.matched_evidence_ids || []).filter(
      (id: string) => id !== params.evidence_id
    )
    if (req.matched_evidence_ids.length === 0) {
      req.status = "gap"
      req.confidence = "low"
    }
    req.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("jobs")
      .update({
        evidence_map: evidenceMap,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.job_id)
      .eq("updated_at", job.updated_at)

    if (error) return { success: false, error: "Concurrent update conflict. Try again." }

    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        action: "unmap",
        requirement_id: params.requirement_id,
        evidence_id: params.evidence_id,
        session_id: context.sessionId,
      },
    })

    revalidatePath(`/jobs/${params.job_id}`)
    revalidatePath(`/jobs/${params.job_id}/evidence-match`)

    return {
      success: true,
      data: { requirement_id: params.requirement_id, status: req.status },
      metadata: { tool_call_id: context.toolCallId },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to unmap evidence",
    }
  }
}

// ─── Mark Requirement Addressed ─────────────────────────────────────────────

interface MarkRequirementParams {
  job_id: string
  requirement_id: string
  rationale: string
}

export async function executeMarkRequirementAddressed(
  params: MarkRequirementParams,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    // Fetch job
    const { data: job } = await supabase
      .from("jobs")
      .select("id, user_id, evidence_map, updated_at")
      .eq("id", params.job_id)
      .single()

    if (!job || job.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    const evidenceMap = job.evidence_map || { requirement_matches: [] }
    const req = (evidenceMap.requirement_matches || []).find(
      (r: any) => r.requirement_id === params.requirement_id
    )

    if (!req) {
      return { success: false, error: "Requirement not found" }
    }

    const prevStatus = req.status

    // This records user confirmation, but does not fabricate proof. A separate
    // evidence item is still needed before the requirement can become met.
    req.status = req.matched_evidence_ids?.length ? "partial" : "partial"
    req.confidence = "medium"
    req.marked_addressed_rationale = params.rationale
    req.marked_addressed_at = new Date().toISOString()
    req.marked_addressed_by_session = context.sessionId

    // Write back
    const { error } = await supabase
      .from("jobs")
      .update({
        evidence_map: evidenceMap,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.job_id)
      .eq("updated_at", job.updated_at)

    if (error) {
      return { success: false, error: "Update failed" }
    }

    // Emit event
    await handleDomainEvent({
      supabase,
      event_type: "requirement_addressed",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        requirement_id: params.requirement_id,
        prev_status: prevStatus,
        rationale: params.rationale,
        session_id: context.sessionId,
      },
    })

    revalidatePath(`/jobs/${params.job_id}`)

    return {
      success: true,
      data: { requirement_id: params.requirement_id, status: "partial" },
      undoable: true,
      undoAction: "unmarkRequirementAddressed",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark requirement",
    }
  }
}

// ─── Derive Composite Evidence ─────────────────────────────────────────────

interface DeriveCompositeEvidenceParams {
  job_id: string
  requirement_id: string
  title: string
  requirement_summary: string
  total_years: number
  role_breakdown: Array<{
    role: string
    company?: string
    years: number
    date_range?: string
    evidence_id?: string
  }>
  supporting_evidence_ids?: string[]
  notes?: string
}

export async function executeDeriveCompositeEvidence(
  params: DeriveCompositeEvidenceParams,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    if (!context.confirmed) {
      const roles = params.role_breakdown
        .map((item) => `${item.role}${item.company ? ` at ${item.company}` : ""}: ${item.years} year${item.years === 1 ? "" : "s"}`)
        .join("; ")

      return {
        success: false,
        needsConfirmation: true,
        confirmationPrompt: `Create derived evidence "${params.title}" totaling ${params.total_years} years from: ${roles}?`,
      }
    }

    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    const { data: job } = await supabase
      .from("jobs")
      .select("id, user_id, evidence_map")
      .eq("id", params.job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single()

    if (!job) return { success: false, error: "Job not found" }

    const evidenceMap = job.evidence_map as { requirement_matches?: Array<Record<string, unknown>> } | null
    const requirement = evidenceMap?.requirement_matches?.find(
      (match) => match.requirement_id === params.requirement_id
    )

    if (!requirement) return { success: false, error: "Requirement not found" }

    const supportingIds = Array.from(new Set([
      ...(params.supporting_evidence_ids ?? []),
      ...params.role_breakdown.map((item) => item.evidence_id).filter((id): id is string => Boolean(id)),
    ]))

    let supportingTitles: string[] = []
    if (supportingIds.length > 0) {
      const { data: supportingEvidence, error: supportingError } = await supabase
        .from("evidence_library")
        .select("id, source_title")
        .in("id", supportingIds)
        .eq("user_id", userId)
        .eq("is_active", true)

      if (supportingError) throw supportingError
      supportingTitles = (supportingEvidence ?? []).map((item) => item.source_title)
    }

    const breakdownLines = params.role_breakdown.map((item) => {
      const label = [item.role, item.company].filter(Boolean).join(" at ")
      const range = item.date_range ? ` (${item.date_range})` : ""
      return `${label}${range}: ${item.years} year${item.years === 1 ? "" : "s"}`
    })

    const proofSnippet = [
      `${params.requirement_summary}: ${params.total_years} total years based on user-confirmed role history.`,
      `Breakdown: ${breakdownLines.join("; ")}.`,
      supportingTitles.length ? `Linked supporting evidence: ${supportingTitles.join("; ")}.` : null,
      params.notes ? `Notes: ${params.notes}` : null,
    ].filter(Boolean).join(" ")

    const { data: evidence, error: insertError } = await supabase
      .from("evidence_library")
      .insert({
        user_id: userId,
        source_title: params.title,
        source_type: "work_experience",
        proof_snippet: proofSnippet,
        outcomes: [`${params.total_years} total years of relevant experience`],
        responsibilities: breakdownLines,
        confidence_level: "medium",
        evidence_weight: "composite",
        is_user_approved: true,
        created_at: new Date().toISOString(),
      })
      .select("id, source_title, source_type")
      .single()

    if (insertError) throw insertError

    const mappingResult = await mapConfirmedEvidenceToRequirement({
      supabase,
      userId,
      jobId: params.job_id,
      sessionId: context.sessionId,
      requirementId: params.requirement_id,
      evidenceId: evidence.id,
      evidenceTitle: evidence.source_title,
      evidenceType: evidence.source_type,
    })

    await handleDomainEvent({
      supabase,
      event_type: "evidence_added",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        evidence_id: evidence.id,
        title: evidence.source_title,
        requirement_id: params.requirement_id,
        total_years: params.total_years,
        role_breakdown: params.role_breakdown,
        supporting_evidence_ids: supportingIds,
        session_id: context.sessionId,
        derived: true,
      },
    })

    await handleDomainEvent({
      supabase,
      event_type: "evidence_mapped",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        requirement_id: params.requirement_id,
        evidence_id: evidence.id,
        prev_status: mappingResult.prevStatus,
        new_status: mappingResult.newStatus,
        via: "derive_composite_evidence",
        session_id: context.sessionId,
      },
    })

    revalidatePath("/evidence")
    revalidatePath(`/jobs/${params.job_id}`)
    revalidatePath(`/jobs/${params.job_id}/evidence-match`)

    return {
      success: true,
      data: {
        id: evidence.id,
        title: evidence.source_title,
        total_years: params.total_years,
        status: mappingResult.newStatus,
      },
      undoable: true,
      undoAction: "deleteEvidence",
      metadata: {
        tool_call_id: context.toolCallId,
        supporting_evidence_ids: supportingIds,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to derive composite evidence",
    }
  }
}

// ─── Record Outcome ────────────────────────────────────────────────────────

interface RecordOutcomeParams {
  job_id: string
  outcome:
    | "interview_scheduled"
    | "interview_completed"
    | "rejection"
    | "offer_received"
    | "offer_accepted"
    | "ghosted"
    | "application_withdrawn"
  outcome_notes?: string
  date_received?: string
}

function outcomeToJobStatus(outcome: RecordOutcomeParams["outcome"]): string | null {
  switch (outcome) {
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

export async function executeRecordOutcome(
  params: RecordOutcomeParams,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    const outcomeDate = params.date_received || new Date().toISOString()
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, applied_at, score, resume_strategy")
      .eq("id", params.job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle()

    if (jobError || !job) {
      return { success: false, error: "Job not found" }
    }

    const daysToResponse = job.applied_at
      ? Math.round((new Date(outcomeDate).getTime() - new Date(job.applied_at).getTime()) / 86400000)
      : null

    const { error: outcomeError } = await supabase
      .from("application_outcomes")
      .upsert({
        user_id: userId,
        job_id: params.job_id,
        outcome: params.outcome,
        outcome_date: outcomeDate,
        days_to_response: daysToResponse,
        response_source: "coach",
        fit_score: job.score ?? null,
        generation_strategy: job.resume_strategy ?? null,
        notes: params.outcome_notes ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,job_id",
      })

    if (outcomeError) throw outcomeError

    const jobStatus = outcomeToJobStatus(params.outcome)
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        outcome: params.outcome,
        outcome_date: outcomeDate,
        days_to_response: daysToResponse,
        ...(jobStatus ? { status: jobStatus } : {}),
      })
      .eq("id", params.job_id)
      .eq("user_id", userId)

    if (jobUpdateError) throw jobUpdateError

    // Emit event
    await handleDomainEvent({
      supabase,
      event_type: "outcome_updated",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        outcome: params.outcome,
        notes: params.outcome_notes,
        days_to_response: daysToResponse,
        session_id: context.sessionId,
      },
    })

    revalidatePath(`/jobs/${params.job_id}`)
    revalidatePath("/applications")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: { outcome: params.outcome, days_to_response: daysToResponse },
      undoable: true,
      undoAction: "clearOutcome",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record outcome",
    }
  }
}

// ─── Archive Job ───────────────────────────────────────────────────────────

export async function executeArchiveJob(
  params: { job_id: string; reason?: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    if (!context.confirmed) {
      return {
        success: false,
        needsConfirmation: true,
        confirmationPrompt: "Archive this job? It will be hidden from your active pipeline.",
      }
    }

    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    // Archive job
    const { error } = await supabase
      .from("jobs")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        archive_reason: params.reason,
        archived_by_session: context.sessionId,
      })
      .eq("id", params.job_id)
      .eq("user_id", userId)

    if (error) throw error

    // Emit event
    await handleDomainEvent({
      supabase,
      event_type: "job_archived",
      job_id: params.job_id,
      user_id: userId,
      source: "coach_tool",
      payload: {
        reason: params.reason,
        session_id: context.sessionId,
      },
    })

    revalidatePath("/jobs")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: { archived: true },
      undoable: true,
      undoAction: "unarchiveJob",
      metadata: {
        tool_call_id: context.toolCallId,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to archive job",
    }
  }
}

export async function executeMarkSessionComplete(
  params: { session_id: string; summary?: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const userId = auth.userId
    const supabase = auth.supabase

    const { data: session, error } = await supabase
      .from("coach_sessions")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.session_id || context.sessionId)
      .eq("user_id", userId)
      .select("id, job_id")
      .maybeSingle()

    if (error) throw error
    if (!session) return { success: false, error: "Session not found" }

    await handleDomainEvent({
      supabase,
      event_type: "coach_action_taken",
      job_id: session.job_id ?? context.jobId ?? null,
      user_id: userId,
      source: "coach_tool",
      payload: {
        action: "session_completed",
        session_id: session.id,
        summary: params.summary ?? null,
      },
    })

    return {
      success: true,
      data: { session_id: session.id, status: "completed" },
      metadata: { tool_call_id: context.toolCallId },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete session",
    }
  }
}

// ─── Prove Fit Tools ──────────────────────────────────────────────────────────

export async function executeConfirmProof(
  params: { job_id: string; requirement_id: string; claim_text: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  if (!context.confirmed) {
    return {
      success: false,
      needsConfirmation: true,
      confirmationPrompt: `Save this confirmed claim? "${params.claim_text.slice(0, 120)}"`,
    }
  }

  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const { userId, supabase } = auth

    const { data: job } = await supabase
      .from("jobs")
      .select("id, evidence_map, evidence_map_version")
      .eq("id", params.job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!job) return { success: false, error: "Job not found" }

    const canonicalMap = asCanonicalEvidenceMap(job.evidence_map)
    if (!canonicalMap) return { success: false, error: "Evidence map not ready" }

    const requirement = canonicalMap.requirement_matches.find(
      (m) => m.requirement_id === params.requirement_id,
    )
    if (!requirement) return { success: false, error: "Requirement not found" }

    const answerValidation = validateCoachAnswer(
      params.claim_text,
      requirement.requirement_text,
    )
    const evidenceTitle = `Confirmed fit: ${requirement.normalized_requirement || requirement.requirement_text}`.slice(0, 180)

    const { data: evidenceRow, error: evidenceError } = await supabase
      .from("evidence_library")
      .insert({
        user_id: userId,
        source_type: "user_input",
        source_title: evidenceTitle,
        proof_snippet: params.claim_text,
        confidence_level: "medium",
        confidence_score: answerValidation.confidence,
        is_active: true,
        is_user_approved: true,
        raw_resume_section: "match_interview",
        responsibilities: [requirement.requirement_text],
        approved_keywords: requirement.related_skills ?? [],
        normalized_label: requirement.normalized_requirement,
        what_not_to_overstate: answerValidation.what_not_to_overstate,
      })
      .select("id")
      .single()

    if (evidenceError || !evidenceRow) {
      return { success: false, error: "Could not save evidence" }
    }

    const insertedEvidenceId = evidenceRow.id
    const evidenceRows = await loadEvidenceRows(supabase, userId)

    const nextEvidenceMap = withUpdatedRequirementMatches(
      job.evidence_map,
      canonicalMap.requirement_matches.map((match) =>
        match.requirement_id === params.requirement_id
          ? {
              ...match,
              status: match.status === "met" ? "met" : "partial",
              matched_evidence_ids: Array.from(new Set([...match.matched_evidence_ids, insertedEvidenceId])),
              matched_evidence_titles: Array.from(new Set([...match.matched_evidence_titles, evidenceTitle])),
              evidence_types: Array.from(new Set([...match.evidence_types, "user_input"])),
              confidence: match.confidence === "high" ? "high" : "medium",
              match_method: "manual",
              reasoning: "User confirmed this claim in the Match Interview. Use exactly what was confirmed; do not overstate it.",
              riskFlags: (match.riskFlags ?? []).filter((f) => !["missing_evidence", "no_packet_evidence"].includes(f)),
              proof_decision: "confirmed",
              user_claim: params.claim_text,
              skip_reason: null,
              confirmed_at: new Date().toISOString(),
              skipped_at: null,
              updated_at: new Date().toISOString(),
            }
          : match,
      ),
      evidenceRows,
    )

    const update = await guardedCoachStepUpdate({
      supabase,
      userId,
      jobId: params.job_id,
      currentVersion: job.evidence_map_version ?? null,
      values: { evidence_map: nextEvidenceMap },
    })

    if (!update.ok) {
      await supabase.from("evidence_library").delete().eq("id", insertedEvidenceId).eq("user_id", userId)
      return { success: false, error: update.conflict ? "Conflict — reload and retry" : "Update failed" }
    }

    await upsertProveFitDecision(supabase, {
      userId,
      jobId: params.job_id,
      requirementId: params.requirement_id,
      requirementText: requirement.requirement_text,
      decision: "confirmed",
      evidenceId: insertedEvidenceId,
      claimText: params.claim_text,
    })

    await emitCoachEvent(supabase, userId, params.job_id, "confirm_proof", {
      requirement_id: params.requirement_id,
      evidence_id: insertedEvidenceId,
    })

    revalidatePath(`/jobs/${params.job_id}/evidence-match`)
    revalidatePath(`/jobs/${params.job_id}`)

    return {
      success: true,
      data: { evidence_id: insertedEvidenceId, requirement_id: params.requirement_id },
      metadata: { tool_call_id: context.toolCallId },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to confirm proof" }
  }
}

export async function executeSkipRequirement(
  params: { job_id: string; requirement_id: string; skip_reason?: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const auth = await requireUser()
    if (!auth.ok) return { success: false, error: "Unauthorized" }
    const { userId, supabase } = auth

    const { data: job } = await supabase
      .from("jobs")
      .select("id, evidence_map, evidence_map_version")
      .eq("id", params.job_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle()

    if (!job) return { success: false, error: "Job not found" }

    const canonicalMap = asCanonicalEvidenceMap(job.evidence_map)
    if (!canonicalMap) return { success: false, error: "Evidence map not ready" }

    const requirement = canonicalMap.requirement_matches.find(
      (m) => m.requirement_id === params.requirement_id,
    )
    if (!requirement) return { success: false, error: "Requirement not found" }

    const skipReason = params.skip_reason ?? "User chose to skip this claim."
    const evidenceRows = await loadEvidenceRows(supabase, userId)

    const nextEvidenceMap = withUpdatedRequirementMatches(
      job.evidence_map,
      canonicalMap.requirement_matches.map((match) =>
        match.requirement_id === params.requirement_id
          ? {
              ...match,
              proof_decision: "skipped",
              skip_reason: skipReason,
              skipped_at: new Date().toISOString(),
              reasoning: "User explicitly skipped this requirement; generated materials must not claim it.",
              riskFlags: Array.from(new Set([...(match.riskFlags ?? []), "user_skipped"])),
              updated_at: new Date().toISOString(),
            }
          : match,
      ),
      evidenceRows,
    )

    const update = await guardedCoachStepUpdate({
      supabase,
      userId,
      jobId: params.job_id,
      currentVersion: job.evidence_map_version ?? null,
      values: { evidence_map: nextEvidenceMap },
    })

    if (!update.ok) {
      return { success: false, error: update.conflict ? "Conflict — reload and retry" : "Update failed" }
    }

    await upsertProveFitDecision(supabase, {
      userId,
      jobId: params.job_id,
      requirementId: params.requirement_id,
      requirementText: requirement.requirement_text,
      decision: "skipped",
      skipReason,
    })

    await emitCoachEvent(supabase, userId, params.job_id, "skip_requirement", {
      requirement_id: params.requirement_id,
    })

    revalidatePath(`/jobs/${params.job_id}/evidence-match`)
    revalidatePath(`/jobs/${params.job_id}`)

    return {
      success: true,
      data: { requirement_id: params.requirement_id, skipped: true },
      metadata: { tool_call_id: context.toolCallId },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to skip requirement" }
  }
}
