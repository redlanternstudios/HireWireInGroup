/**
 * HireWire Domain Events
 *
 * All side-effectful transitions in the pipeline emit a DomainEvent.
 * Events are persisted to audit_events and used to drive cache invalidation.
 *
 * Rule: one event type per meaningful state transition. No catch-all events.
 */

// ---------------------------------------------------------------------------
// Event type registry — the exhaustive union
// ---------------------------------------------------------------------------

export const DOMAIN_EVENT_TYPES = [
  // Analysis pipeline
  "job.analyzed",
  "job.re_analyzed",
  "job.analysis_failed",

  // Scoring
  "job.scored",

  // Document generation
  "job.generation_started",
  "job.generation_complete",
  "job.generation_failed",

  // Package review (acceptance gate)
  "package.accepted",
  "package.needs_review",
  "package.reset",

  // Application
  "job.applied",

  // Lifecycle
  "job.archived",
  "job.status_changed",

  // Quality
  "job.quality_passed",
  "job.quality_failed",
] as const

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number]

// ---------------------------------------------------------------------------
// Event shape
// ---------------------------------------------------------------------------

export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  /** Canonical event type string */
  type: DomainEventType
  /** The job this event belongs to */
  jobId: string
  /** The user who owns the job */
  userId: string
  /** Event-specific structured payload */
  payload: TPayload
  /** ISO timestamp — defaults to now() if omitted */
  occurredAt?: string
  /** Correlation ID for tracing across a multi-step flow */
  correlationId?: string
}

// ---------------------------------------------------------------------------
// Typed payload helpers — narrow payloads per event type
// ---------------------------------------------------------------------------

export interface JobAnalyzedPayload {
  analysisId: string
  score?: number | null
  fit?: string | null
  qualificationsCount: number
  responsibilitiesCount: number
}

export interface JobScoredPayload {
  overallScore: number
  fit: string
  confidence: number
}

export interface GenerationStartedPayload {
  attempt: number
}

export interface GenerationCompletePayload {
  generationTimestamp: string
  qualityScore?: number | null
  qualityPassed?: boolean
}

export interface GenerationFailedPayload {
  error: string
  attempt: number
}

export interface PackageAcceptedPayload {
  acceptedAt: string
  previousStatus?: string | null
}

export interface PackageNeedsReviewPayload {
  reason: string
  flaggedAt: string
}

export interface JobAppliedPayload {
  appliedAt: string
  method: string
  applicationId?: string
}

export interface JobStatusChangedPayload {
  from: string
  to: string
  reason?: string
}
