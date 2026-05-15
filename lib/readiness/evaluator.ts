export type ReadinessChecklistState = {
  resume: boolean
  coverLetter: boolean
  evidence: boolean
  quality: boolean
  voiceIntegrity?: boolean
}

export type ReadinessStage =
  | "outcome"
  | "ready"
  | "quality_review"
  | "evidence_blocked"
  | "materials_missing"

export type OutcomeState =
  | "active"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "archived"

export type ReadinessNextAction = {
  label: string
  href: string
  description: string
}

export type ReadinessResult = {
  isReady: boolean
  canApply: boolean
  canGenerate: boolean
  stage: ReadinessStage
  outcome: OutcomeState
  blockedReasons: string[]
  checklist: ReadinessChecklistState
  nextAction: ReadinessNextAction | null
}

export type ReadinessJob = {
  id?: string | null
  status?: string | null
  applied_at?: string | null
  generated_resume?: string | null
  generated_cover_letter?: string | null
  evidence_map?: unknown
  quality_passed?: boolean | null
}


import { isVoiceIntegrityPassed, getVoiceBlockedReason } from './voice-readiness'

export function evaluateReadiness(job: ReadinessJob & { voice_drift_result?: any }): ReadinessResult {
  const voiceIntegrity = isVoiceIntegrityPassed(job.voice_drift_result ?? null)
  const checklist = {
    resume: !!job.generated_resume,
    coverLetter: !!job.generated_cover_letter,
    evidence: hasMinimumEvidence(job),
    quality: job.quality_passed === true,
    voiceIntegrity,
  }

  const outcome = getOutcomeState(job)
  const isOutcome = outcome !== "active"
  const hasMaterials = checklist.resume && checklist.coverLetter
  const isReady = Object.values(checklist).every(Boolean)
  const canApply = isReady && !isOutcome
  const canGenerate = checklist.evidence && !hasMaterials && !isOutcome
  const stage = getReadinessStage(checklist, outcome)
  const nextAction = getNextAction(job, checklist, stage, outcome)

  const blockedReasons: string[] = []
  if (!checklist.resume) blockedReasons.push("Resume not generated")
  if (!checklist.coverLetter) blockedReasons.push("Cover letter not generated")
  if (!checklist.evidence) blockedReasons.push("Insufficient evidence match")
  if (!checklist.quality) blockedReasons.push("Quality check failed")
  if (!checklist.voiceIntegrity) {
    const reason = getVoiceBlockedReason(job.voice_drift_result ?? null)
    if (reason) blockedReasons.push(reason)
  }

  return {
    isReady,
    canApply,
    canGenerate,
    stage,
    outcome,
    blockedReasons,
    checklist,
    nextAction,
  }
}

function getOutcomeState(job: ReadinessJob): OutcomeState {
  const status = job.status ?? "active"
  if (job.applied_at || status === "applied") return "applied"
  if (status === "interviewing") return "interviewing"
  if (status === "offered") return "offered"
  if (status === "rejected") return "rejected"
  if (status === "archived") return "archived"
  return "active"
}

function getReadinessStage(
  checklist: ReadinessChecklistState,
  outcome: OutcomeState
): ReadinessStage {
  if (outcome !== "active") return "outcome"
  if (Object.values(checklist).every(Boolean)) return "ready"
  if (!checklist.resume || !checklist.coverLetter) return "materials_missing"
  if (!checklist.evidence) return "evidence_blocked"
  return "quality_review"
}

function getNextAction(
  job: ReadinessJob,
  checklist: ReadinessChecklistState,
  stage: ReadinessStage,
  outcome: OutcomeState
): ReadinessNextAction | null {
  if (outcome !== "active") return null

  const jobHref = job.id ? `/jobs/${job.id}` : "/jobs"
  if (!checklist.evidence) {
    return {
      label: "Fix evidence",
      href: job.id ? `/jobs/${job.id}/evidence-match` : "/evidence",
      description: "Add or map proof points before this job can move forward.",
    }
  }

  if (!checklist.resume || !checklist.coverLetter) {
    return {
      label: "Generate materials",
      href: job.id ? `/jobs/${job.id}/documents` : "/jobs",
      description: "Create the evidence-grounded resume and cover letter.",
    }
  }

  if (stage === "quality_review") {
    return {
      label: "Review package",
      href: job.id ? `/jobs/${job.id}/documents` : "/documents",
      description: "Review quality issues before applying.",
    }
  }

  if (stage === "ready") {
    return {
      label: "Apply now",
      href: "/ready-to-apply",
      description: "Submit through the readiness gate.",
    }
  }

  return null
}

function hasMinimumEvidence(job: ReadinessJob) {
  const evidenceMap = asRecord(job.evidence_map)
  if (!evidenceMap) return false

  const mappedItems = evidenceMap.mapped_items
  if (Array.isArray(mappedItems)) {
    return mappedItems.length >= 2
  }

  const selectedEvidenceIds = evidenceMap.selected_evidence_ids
  if (Array.isArray(selectedEvidenceIds)) {
    return selectedEvidenceIds.length >= 2
  }

  const evidenceMatches = evidenceMap.evidence_matches
  if (Array.isArray(evidenceMatches)) {
    return evidenceMatches.length >= 2
  }

  const mappedRequirementKeys = Object.keys(evidenceMap).filter(
    key =>
      ![
        "matching_complete",
        "completed_at",
        "bullet_provenance",
        "paragraph_provenance",
        "selected_evidence_ids",
        "blocked_evidence",
        "mapped_items",
        "score_gaps",
      ].includes(key)
  )

  return mappedRequirementKeys.length >= 2
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}
