/**
 * lib/domain-events/event-types.ts
 *
 * Canonical domain event taxonomy for HireWire.
 *
 * Every important mutation must emit one of these events.
 * Events are the system's paper trail: they answer
 * "what changed, when, why, and what became invalid."
 *
 * Consumers: logs page, coach, analytics, readiness recomputation,
 * invalidation cascades, and export integrity.
 */

// ─── Event type string literals ──────────────────────────────────────────────

export type DomainEventType =
  // Job lifecycle
  | "job_created"
  | "job_analyzed"
  | "job_deleted"
  // Evidence
  | "evidence_added"
  | "evidence_updated"
  | "evidence_deleted"
  | "evidence_mapped"
  // Resume source
  | "resume_uploaded"
  | "voice_profile_extracted"
  // Document generation
  | "documents_generated"
  | "document_edited"
  | "format_changed"
  | "font_changed"
  // Quality
  | "quality_passed"
  | "quality_failed"
  | "quality_invalidated"
  // Package review
  | "package_reviewed"
  | "package_invalidated"
  // Readiness
  | "readiness_changed"
  // Integrity / voice
  | "voice_drift_detected"
  | "override_logged"
  // Application
  | "application_submitted"
  | "application_failed"
  | "outcome_updated"
  // Coach
  | "coach_action_taken"
  // Export
  | "export_generated"

// ─── Severity ─────────────────────────────────────────────────────────────────

export type DomainEventSeverity = "info" | "warning" | "error" | "critical"

// ─── Source ──────────────────────────────────────────────────────────────────

export type DomainEventSource =
  | "apply_action"
  | "package_review_action"
  | "document_action"
  | "evidence_action"
  | "generate_documents_route"
  | "analyze_job_route"
  | "coach_route"
  | "export_route"
  | "system"
  | "user"

// ─── Invalidation targets ─────────────────────────────────────────────────────

export type InvalidationTarget =
  | "quality"
  | "package_review"
  | "readiness"
  | "analytics_cache"
  | "coach_state"
  | "documents"
  | "dashboard"
  | "ready_to_apply"
  | "logs"
  | "applications"

// ─── Recompute targets ────────────────────────────────────────────────────────

export type RecomputeTarget = "readiness"

// ─── Affected routes for revalidation ─────────────────────────────────────────

export type AffectedRoute = string // e.g. "/dashboard", "/jobs/[id]"

// ─── Core event envelope ──────────────────────────────────────────────────────

export interface DomainEvent {
  event_id: string
  event_type: DomainEventType
  /** Null for events not scoped to a single job (e.g. evidence_added, resume_uploaded) */
  job_id: string | null
  user_id: string
  timestamp: string
  source: DomainEventSource
  payload: Record<string, unknown>
  invalidates: InvalidationTarget[]
  recomputes: RecomputeTarget[]
  affected_routes: AffectedRoute[]
  severity: DomainEventSeverity
  metadata: Record<string, unknown>
}

// ─── Readiness snapshot embedded in readiness_changed events ─────────────────

export interface ReadinessSnapshot {
  isReady: boolean
  canApply: boolean
  stage: string
  outcome: string
  blockedReasons: string[]
  checklist: {
    resume: boolean
    coverLetter: boolean
    evidence: boolean
    quality: boolean
  }
  nextAction: { label: string; href: string } | null
  invalidated_by: DomainEventType | null
  last_evaluated_at: string
}

// ─── Builder input (omits system-generated fields) ───────────────────────────

export type DomainEventInput = Omit<
  DomainEvent,
  "event_id" | "timestamp"
>
