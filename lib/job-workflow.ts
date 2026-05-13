/**
 * HireWire Job Workflow
 * 
 * Canonical workflow stage derivation based on actual persisted artifacts.
 * This is the single source of truth for workflow state - no UI should
 * derive workflow state locally.
 * 
 * Workflow stages (in order):
 * 1. job_ingested - Job URL/description submitted but not analyzed
 * 2. job_parsed - Job analyzed, requirements extracted
 * 3. evidence_mapped - User has mapped evidence to requirements
 * 4. fit_scored - Score calculated and persisted
 * 5. materials_generated - Resume and cover letter generated
 * 6. ready - Quality checks passed, ready to apply
 * 7. applied - Application submitted
 */

import type { Job, EvidenceRecord } from "./types"

// ============================================================================
// WORKFLOW STAGE TYPES
// ============================================================================

export type WorkflowStage =
  | "job_ingested"      // Job added but not analyzed
  | "job_parsed"        // Analysis complete, requirements extracted
  | "evidence_mapped"   // Evidence matched to requirements
  | "fit_scored"        // Score calculated and saved
  | "materials_generated" // Resume and cover letter exist
  | "ready"             // Quality passed, can apply
  | "applied"           // Application submitted

export interface WorkflowState {
  stage: WorkflowStage
  stageIndex: number
  isComplete: boolean
  nextAction: WorkflowAction | null
  blockers: string[]
  progress: {
    parsed: boolean
    evidenceMapped: boolean
    scored: boolean
    materialsGenerated: boolean
    qualityPassed: boolean
    applied: boolean
  }
}

export interface WorkflowAction {
  label: string
  href: string
  variant: "default" | "secondary" | "outline"
  description: string
}

// ============================================================================
// STAGE CONFIGURATION
// ============================================================================

export const WORKFLOW_STAGES: WorkflowStage[] = [
  "job_ingested",
  "job_parsed",
  "evidence_mapped",
  "fit_scored",
  "materials_generated",
  "ready",
  "applied",
]

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  job_ingested: "Draft",
  job_parsed: "Parsed",
  evidence_mapped: "Evidence Mapped",
  fit_scored: "Scored",
  materials_generated: "Materials Ready",
  ready: "Ready to Apply",
  applied: "Applied",
}

export const STAGE_DESCRIPTIONS: Record<WorkflowStage, string> = {
  job_ingested: "Job added, awaiting analysis",
  job_parsed: "Requirements extracted from job posting",
  evidence_mapped: "Your evidence mapped to job requirements",
  fit_scored: "Fit score calculated based on evidence coverage",
  materials_generated: "Resume and cover letter generated",
  ready: "Quality checks passed, ready to submit application",
  applied: "Application submitted",
}

// ============================================================================
// WORKFLOW STATE DERIVATION
// ============================================================================

/**
 * Derives the current workflow stage from persisted job artifacts.
 * This is the canonical function - all UI should use this.
 */
export function deriveWorkflowStage(job: Job | null): WorkflowStage {
  if (!job) return "job_ingested"
  
  // Check applied status first (terminal state)
  if (job.status === "applied") {
    return "applied"
  }
  
  // Check for generated materials with quality pass
  if (hasGeneratedMaterials(job) && hasQualityPass(job)) {
    return "ready"
  }
  
  // Check for generated materials (without quality pass)
  if (hasGeneratedMaterials(job)) {
    return "materials_generated"
  }
  
  // Check for persisted score
  if (hasPersistedScore(job)) {
    return "fit_scored"
  }
  
  // Check for evidence mapping
  if (hasEvidenceMap(job)) {
    return "evidence_mapped"
  }
  
  // Check for job analysis (parsing complete)
  if (hasJobAnalysis(job)) {
    return "job_parsed"
  }
  
  return "job_ingested"
}

/**
 * Gets the full workflow state including progress, blockers, and next action.
 */
export function getWorkflowState(job: Job | null, jobId?: string): WorkflowState {
  const stage = deriveWorkflowStage(job)
  const stageIndex = WORKFLOW_STAGES.indexOf(stage)
  
  const progress = {
    parsed: hasJobAnalysis(job),
    evidenceMapped: hasEvidenceMap(job),
    scored: hasPersistedScore(job),
    materialsGenerated: hasGeneratedMaterials(job),
    qualityPassed: hasQualityPass(job),
    applied: job?.status === "applied",
  }
  
  const blockers = getBlockers(job, progress)
  const nextAction = getNextAction(stage, jobId || job?.id)
  const isComplete = stage === "applied"
  
  return {
    stage,
    stageIndex,
    isComplete,
    nextAction,
    blockers,
    progress,
  }
}

// ============================================================================
// ARTIFACT CHECKS
// ============================================================================

/**
 * Check if job has been analyzed (requirements extracted)
 */
export function hasJobAnalysis(job: Job | null): boolean {
  if (!job) return false

  // True signal: AI extraction produced requirements (written to job_analyses, flattened by getJobById).
  // job_description alone is raw scraped text — it proves the page was fetched, not that
  // requirements were successfully extracted. Do not use it as a gate signal.
  return (
    ((job.qualifications_required?.length ?? 0) > 0) ||
    ((job.responsibilities?.length ?? 0) > 0)
  )
}

/**
 * Check if evidence has been mapped to requirements
 */
export function hasEvidenceMap(job: Job | null): boolean {
  if (!job) return false
  
  const evidenceMap = job.evidence_map
  if (!evidenceMap) return false
  
  // Check if evidence_map has any keys (requirements mapped)
  if (typeof evidenceMap === 'object') {
    const keys = Object.keys(evidenceMap)
    // Filter out metadata keys
    const requirementKeys = keys.filter(k => !k.startsWith('_') && k !== 'matching_complete' && k !== 'gaps_acknowledged')
    return requirementKeys.length > 0
  }
  
  return false
}

/**
 * Check if evidence mapping is marked complete by user
 */
export function isEvidenceMappingComplete(job: Job | null): boolean {
  if (!job?.evidence_map) return false
  
  const map = job.evidence_map as Record<string, unknown>
  return map.matching_complete === true
}

/**
 * Check if gaps have been acknowledged
 */
export function areGapsAcknowledged(job: Job | null): boolean {
  if (!job?.evidence_map) return false
  
  const map = job.evidence_map as Record<string, unknown>
  return map.gaps_acknowledged === true
}

/**
 * Check if score has been persisted to database
 */
export function hasPersistedScore(job: Job | null): boolean {
  if (!job) return false
  return job.score !== null && job.score !== undefined
}

/**
 * Check if materials have been generated
 */
export function hasGeneratedMaterials(job: Job | null): boolean {
  if (!job) return false
  return !!job.generated_resume && !!job.generated_cover_letter
}

/**
 * Check if quality checks have passed
 */
export function hasQualityPass(job: Job | null): boolean {
  if (!job) return false
  
  // Explicit quality pass
  if (job.quality_passed === true) return true
  
  // No quality issues also counts as pass
  if (job.generation_quality_issues && job.generation_quality_issues.length === 0) return true
  
  return false
}

// ============================================================================
// WORKFLOW ACTIONS
// ============================================================================

/**
 * Get the next action based on current workflow stage
 */
export function getNextAction(stage: WorkflowStage, jobId?: string): WorkflowAction | null {
  const baseHref = jobId ? `/jobs/${jobId}` : '/jobs'
  
  switch (stage) {
    case "job_ingested":
      return {
        label: "Analyze Job",
        href: baseHref,
        variant: "default",
        description: "Extract requirements from job posting",
      }
    
    case "job_parsed":
      return {
        label: "Match Evidence",
        href: `${baseHref}/evidence-match`,
        variant: "default",
        description: "Map your experience to job requirements",
      }
    
    case "evidence_mapped":
      return {
        label: "Generate Materials",
        href: `${baseHref}/documents`,
        variant: "default",
        description: "Generate tailored resume and cover letter",
      }
    
    case "fit_scored":
      return {
        label: "Generate Materials",
        href: `${baseHref}/documents`,
        variant: "default",
        description: "Generate tailored resume and cover letter",
      }
    
    case "materials_generated":
      return {
        label: "Review & Export",
        href: `${baseHref}/documents`,
        variant: "default",
        description: "Review materials and export for application",
      }
    
    case "ready":
      return {
        label: "Mark as Applied",
        href: baseHref,
        variant: "default",
        description: "Record your application submission",
      }
    
    case "applied":
      return null // Terminal state
  }
}

/**
 * Get blockers preventing progression to next stage
 */
function getBlockers(job: Job | null, progress: WorkflowState['progress']): string[] {
  const blockers: string[] = []
  
  if (!job) {
    blockers.push("Job data not loaded")
    return blockers
  }
  
  // Check prerequisites for generation
  if (!progress.parsed) {
    blockers.push("Job must be analyzed first")
  }
  
  if (!progress.evidenceMapped && progress.parsed) {
    blockers.push("Match your evidence to job requirements")
  }
  
  // Check for critical gaps that need addressing
  if (job.score_gaps && job.score_gaps.length > 0 && !areGapsAcknowledged(job)) {
    blockers.push(`${job.score_gaps.length} gap(s) need attention`)
  }
  
  return blockers
}

// ============================================================================
// SECTION ACCESS CONTROL
// ============================================================================

export type JobDetailSection = 
  | "summary"
  | "requirements"
  | "evidence_matching"
  | "fit_analysis"
  | "generation"
  | "materials_preview"
  | "interview_prep"

/**
 * Check if a section should be accessible based on workflow stage
 */
export function canAccessSection(stage: WorkflowStage, section: JobDetailSection): boolean {
  const stageIndex = WORKFLOW_STAGES.indexOf(stage)
  
  switch (section) {
    case "summary":
    case "requirements":
      return true // Always accessible
    
    case "evidence_matching":
      return stageIndex >= WORKFLOW_STAGES.indexOf("job_parsed")
    
    case "fit_analysis":
      return stageIndex >= WORKFLOW_STAGES.indexOf("fit_scored")
    
    case "generation":
      // Requires matching_complete, which is what advances the stage to "evidence_mapped".
      // Gate at evidence_mapped (same as can_generate in readiness.ts).
      return stageIndex >= WORKFLOW_STAGES.indexOf("evidence_mapped")
    
    case "materials_preview":
      return stageIndex >= WORKFLOW_STAGES.indexOf("materials_generated")
    
    case "interview_prep":
      return stageIndex >= WORKFLOW_STAGES.indexOf("materials_generated")
    
    default:
      return false
  }
}

/**
 * Get the reason why a section is locked
 */
export function getSectionLockReason(stage: WorkflowStage, section: JobDetailSection): string | null {
  if (canAccessSection(stage, section)) return null
  
  switch (section) {
    case "evidence_matching":
      return "Analyze job to unlock evidence matching"
    
    case "fit_analysis":
      return "Complete evidence matching and scoring to see fit analysis"
    
    case "generation":
      return "Match your evidence to unlock document generation"
    
    case "materials_preview":
      return "Generate materials to preview documents"
    
    case "interview_prep":
      return "Generate materials to unlock interview prep"
    
    default:
      return "Complete previous steps to unlock"
  }
}

// ============================================================================
// COVERAGE CALCULATION
// ============================================================================

/**
 * Calculate evidence coverage percentage
 */
export function calculateEvidenceCoverage(
  job: Job | null,
  totalRequirements?: number
): number {
  if (!job?.evidence_map) return 0
  
  const map = job.evidence_map as Record<string, unknown>
  const mappedKeys = Object.keys(map).filter(
    k => !k.startsWith('_') && k !== 'matching_complete' && k !== 'gaps_acknowledged'
  )
  
  if (!totalRequirements || totalRequirements === 0) {
    // If we don't know total requirements, return 0 if no mappings
    return mappedKeys.length > 0 ? 50 : 0 // Assume 50% if any mapping exists
  }
  
  return Math.round((mappedKeys.length / totalRequirements) * 100)
}

/**
 * Get gap count from job
 */
export function getGapCount(job: Job | null): number {
  if (!job) return 0
  return job.score_gaps?.length || 0
}

/**
 * Get strength count from job
 */
export function getStrengthCount(job: Job | null): number {
  if (!job) return 0
  return job.score_strengths?.length || 0
}
