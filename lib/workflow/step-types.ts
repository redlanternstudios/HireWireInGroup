import type { ReadinessResult } from "@/lib/readiness/evaluator"
import type { WorkflowStage } from "@/lib/job-workflow"

export type GuidedStepType =
  | "analyzing"
  | "refresh_analysis"
  | "add_example"
  | "generate"
  | "review"
  | "apply"
  | "done"

export type GuidedFlowJob = {
  id: string
  status?: string | null
  role_title?: string | null
  company_name?: string | null
  applied_at?: string | null
  generated_resume?: string | null
  generated_cover_letter?: string | null
  evidence_map?: unknown
  quality_passed?: boolean | null
  score?: number | null
  score_gaps?: string[] | null
  gap_clarifications?: unknown
  gaps_addressed?: string[] | null
}

export type GuidedRequirement = {
  requirement_id: string
  requirement_text: string
  priority?: string
  status?: string
  matched_evidence_ids?: string[]
  matched_evidence_titles?: string[]
  prompt?: string
}

export type NextStep = {
  type: GuidedStepType
  title: string
  description: string
  primaryLabel: string
  secondaryLabel?: string
  href?: string
  requirement?: GuidedRequirement
  readiness: ReadinessResult
  workflowStage: WorkflowStage
}

export type CompleteStepPayload =
  | { step: "apply"; method?: "manual" | "email" | "portal" | "recruiter" }
  | { step: "review" }
  | { step: "refresh_analysis" }
