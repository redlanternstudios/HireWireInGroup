/**
 * lib/coach/tools.ts
 *
 * Coach tool definitions for agentic mutations.
 * Each tool has a description, parameters schema, and execute function.
 *
 * Tools are the coach's interface into the data model:
 * - Evidence CRUD
 * - Evidence mapping to requirements
 * - Job metadata updates
 * - Application outcome recording
 * - Session management
 */

import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Tool Execution Context ────────────────────────────────────────────────

export interface ToolExecutionContext {
  userId: string
  sessionId: string
  jobId?: string
  confirmed?: boolean
  toolCallId?: string
  conversationTurnNumber?: number
  timestamp?: string
}

// ─── Tool Call Result ─────────────────────────────────────────────────────

export interface ToolCallResult {
  success: boolean
  data?: unknown
  error?: string
  needsConfirmation?: boolean
  confirmationPrompt?: string
  undoable?: boolean
  undoAction?: string
  metadata?: Record<string, unknown>
}

// ─── Evidence CRUD Tools ──────────────────────────────────────────────────

export const createEvidenceTool = {
  description:
    "Create a new evidence entry from something the user described. Use this when the user mentions an accomplishment, project, or experience that should be captured.",
  parameters: z.object({
    title: z.string().min(5).max(200).describe("Short title of the evidence (e.g., 'Led AWS Migration')"),
    description: z.string().min(10).max(1000).describe("Detailed description of what was accomplished"),
    skills_demonstrated: z
      .array(z.string().min(2).max(100))
      .min(1)
      .max(10)
      .describe("Skills or technologies demonstrated"),
    company_name: z.string().max(200).optional().describe("Company where this happened"),
    source_type: z
      .enum(["work_experience", "project", "achievement", "certification", "portfolio_entry", "shipped_product", "open_source"])
      .optional()
      .describe("Type of evidence source"),
    outcomes: z
      .array(z.string().min(5).max(200))
      .max(5)
      .optional()
      .describe("Measurable outcomes or results"),
  }),
}

export const updateEvidenceTool = {
  description:
    "Update an existing evidence entry. Use when the user clarifies details or corrects information about existing evidence.",
  parameters: z.object({
    evidence_id: z.string().uuid().describe("ID of the evidence to update"),
    updates: z.object({
      title: z.string().min(5).max(200).optional(),
      description: z.string().min(10).max(1000).optional(),
      skills_demonstrated: z.array(z.string().min(2).max(100)).max(10).optional(),
      outcomes: z.array(z.string().min(5).max(200)).max(5).optional(),
    }),
  }),
}

export const deleteEvidenceTool = {
  description:
    "Delete an evidence entry the user no longer wants. This action requires user confirmation.",
  parameters: z.object({
    evidence_id: z.string().uuid().describe("ID of the evidence to delete"),
    reason: z.string().max(500).optional().describe("Why is this being deleted?"),
  }),
  requiresConfirmation: true,
}

// ─── Evidence Mapping Tools ────────────────────────────────────────────────

export const mapEvidenceToRequirementTool = {
  description:
    "Link evidence to a job requirement, marking the requirement as addressed. Use when evidence clearly matches a requirement.",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job"),
    requirement_id: z.string().describe("ID of the requirement to map to"),
    evidence_id: z.string().uuid().describe("ID of the evidence to map"),
    confidence: z.enum(["high", "medium", "low"]).optional().describe("How confident is this mapping?"),
  }),
}

export const unmapEvidenceTool = {
  description: "Remove evidence from a requirement mapping if it's no longer relevant.",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job"),
    requirement_id: z.string().describe("ID of the requirement"),
    evidence_id: z.string().uuid().describe("ID of the evidence to unmap"),
  }),
}

export const markRequirementAddressedTool = {
  description:
    "Mark a requirement as addressed even without mapped evidence. Use when the user confirms they meet the requirement but don't have existing evidence.",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job"),
    requirement_id: z.string().describe("ID of the requirement"),
    rationale: z
      .string()
      .min(10)
      .max(500)
      .describe("Why should this requirement be marked as addressed?"),
  }),
}

// ─── Application Outcome Tools ────────────────────────────────────────────

export const recordOutcomeTool = {
  description:
    "Record what happened after applying to a job (interview scheduled, rejection received, offer received, etc.)",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job"),
    outcome: z
      .enum(["interview_scheduled", "interview_completed", "rejection", "offer_received", "offer_accepted", "ghosted", "application_withdrawn"])
      .describe("The outcome type"),
    outcome_notes: z
      .string()
      .max(500)
      .optional()
      .describe("Additional details about the outcome"),
    date_received: z.string().optional().describe("ISO 8601 date when outcome occurred"),
  }),
}

// ─── Job Management Tools ─────────────────────────────────────────────────

export const archiveJobTool = {
  description: "Archive a job the user is no longer pursuing. This hides it from the active pipeline.",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job to archive"),
    reason: z
      .string()
      .max(500)
      .describe("Why is this job being archived? (e.g., 'Accepted another role', 'Position filled')"),
  }),
  requiresConfirmation: true,
}

export const setJobPriorityTool = {
  description:
    "Change a job's priority level (high, medium, low). Higher priority jobs appear at the top of the list.",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job"),
    priority: z.enum(["high", "medium", "low"]).describe("New priority level"),
    reason: z.string().max(200).optional().describe("Why change the priority?"),
  }),
}

export const addJobNoteTool = {
  description: "Add a note to a job for personal reference or reminders.",
  parameters: z.object({
    job_id: z.string().uuid().describe("ID of the job"),
    note: z.string().min(5).max(500).describe("The note to add"),
  }),
}

// ─── Session Management Tools ─────────────────────────────────────────────

export const markSessionCompleteTool = {
  description:
    "Mark the current coach session as complete, indicating that the gap has been sufficiently addressed.",
  parameters: z.object({
    session_id: z.string().uuid().describe("ID of the coach session"),
    summary: z
      .string()
      .max(500)
      .optional()
      .describe("Summary of what was accomplished in this session"),
  }),
}

// ─── Tool Registry ────────────────────────────────────────────────────────

export const COACH_TOOLS = {
  createEvidence: createEvidenceTool,
  updateEvidence: updateEvidenceTool,
  deleteEvidence: deleteEvidenceTool,
  mapEvidenceToRequirement: mapEvidenceToRequirementTool,
  unmapEvidence: unmapEvidenceTool,
  markRequirementAddressed: markRequirementAddressedTool,
  recordOutcome: recordOutcomeTool,
  archiveJob: archiveJobTool,
  markSessionComplete: markSessionCompleteTool,
}

export type CoachToolName = keyof typeof COACH_TOOLS
export type CoachTool = (typeof COACH_TOOLS)[CoachToolName]

/**
 * Extract tool names that require explicit confirmation
 */
export function requiresConfirmation(toolName: CoachToolName): boolean {
  const tool = COACH_TOOLS[toolName]
  return (tool as any).requiresConfirmation === true
}

/**
 * Get tool description for LLM
 */
export function getToolDescription(toolName: CoachToolName): string {
  return COACH_TOOLS[toolName].description
}

/**
 * Get tool parameters schema for LLM
 */
export function getToolParameters(toolName: CoachToolName) {
  return COACH_TOOLS[toolName].parameters
}
