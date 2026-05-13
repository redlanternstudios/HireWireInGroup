/**
 * lib/domain-events/invalidation-map.ts
 *
 * Canonical mutation propagation rules.
 *
 * Each event type maps to:
 *   - invalidates: which downstream systems are now stale
 *   - recomputes: which things must be recomputed
 *   - affected_routes: Next.js paths to revalidate
 *   - severity: how critical is this event
 *
 * This is the single source of truth for "what does X breaking mean?"
 */

import type {
  DomainEventType,
  InvalidationTarget,
  RecomputeTarget,
  DomainEventSeverity,
} from "./event-types"

export interface PropagationRule {
  invalidates: InvalidationTarget[]
  recomputes: RecomputeTarget[]
  /** Routes revalidated after this event. job_id substituted where present. */
  routeTemplates: string[]
  severity: DomainEventSeverity
}

type PropagationMap = Partial<Record<DomainEventType, PropagationRule>>

export const INVALIDATION_MAP: PropagationMap = {
  // ── Job lifecycle ────────────────────────────────────────────────────────

  job_created: {
    invalidates: ["dashboard", "analytics_cache"],
    recomputes: [],
    routeTemplates: ["/dashboard", "/jobs"],
    severity: "info",
  },

  job_analyzed: {
    invalidates: ["readiness", "coach_state", "dashboard"],
    recomputes: ["readiness"],
    routeTemplates: ["/dashboard", "/jobs", "/jobs/[id]"],
    severity: "info",
  },

  job_deleted: {
    invalidates: ["dashboard", "analytics_cache", "readiness"],
    recomputes: [],
    routeTemplates: ["/dashboard", "/jobs", "/applications", "/analytics"],
    severity: "warning",
  },

  // ── Evidence ──────────────────────────────────────────────────────────────

  evidence_added: {
    invalidates: ["readiness", "coach_state", "dashboard"],
    recomputes: ["readiness"],
    routeTemplates: ["/dashboard", "/evidence", "/jobs/[id]", "/jobs/[id]/evidence-match"],
    severity: "info",
  },

  evidence_updated: {
    invalidates: ["readiness", "quality", "package_review", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/dashboard", "/evidence", "/jobs/[id]", "/jobs/[id]/evidence-match", "/jobs/[id]/documents"],
    severity: "info",
  },

  evidence_deleted: {
    invalidates: ["readiness", "quality", "package_review", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/dashboard", "/evidence", "/jobs/[id]", "/jobs/[id]/evidence-match"],
    severity: "warning",
  },

  evidence_mapped: {
    invalidates: ["readiness", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]", "/jobs/[id]/evidence-match", "/ready-to-apply"],
    severity: "info",
  },

  // ── Resume source ─────────────────────────────────────────────────────────

  resume_uploaded: {
    invalidates: ["coach_state", "dashboard"],
    recomputes: [],
    routeTemplates: ["/dashboard"],
    severity: "info",
  },

  voice_profile_extracted: {
    invalidates: ["coach_state"],
    recomputes: [],
    routeTemplates: ["/dashboard"],
    severity: "info",
  },

  // ── Document generation ────────────────────────────────────────────────────

  documents_generated: {
    invalidates: ["quality", "package_review", "readiness", "coach_state", "analytics_cache"],
    recomputes: ["readiness"],
    routeTemplates: ["/dashboard", "/jobs/[id]", "/jobs/[id]/documents", "/ready-to-apply"],
    severity: "info",
  },

  document_edited: {
    // Editing a document invalidates the quality check and acceptance — the package
    // must be reviewed again before applying. This is the most critical invalidation.
    invalidates: ["quality", "package_review", "readiness", "analytics_cache", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]/documents", "/ready-to-apply", "/dashboard"],
    severity: "warning",
  },

  format_changed: {
    invalidates: ["package_review"],
    recomputes: [],
    routeTemplates: ["/jobs/[id]/documents", "/ready-to-apply"],
    severity: "info",
  },

  font_changed: {
    invalidates: ["package_review"],
    recomputes: [],
    routeTemplates: ["/jobs/[id]/documents", "/ready-to-apply"],
    severity: "info",
  },

  // ── Quality ───────────────────────────────────────────────────────────────

  quality_passed: {
    invalidates: ["readiness", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]", "/jobs/[id]/documents", "/ready-to-apply", "/dashboard"],
    severity: "info",
  },

  quality_failed: {
    invalidates: ["readiness", "package_review", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]", "/jobs/[id]/documents", "/ready-to-apply", "/dashboard"],
    severity: "warning",
  },

  quality_invalidated: {
    invalidates: ["quality", "package_review", "readiness", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]", "/jobs/[id]/documents", "/ready-to-apply", "/dashboard"],
    severity: "warning",
  },

  // ── Package review ────────────────────────────────────────────────────────

  package_reviewed: {
    invalidates: ["readiness", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]/documents", "/ready-to-apply", "/dashboard"],
    severity: "info",
  },

  package_invalidated: {
    invalidates: ["package_review", "readiness", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]/documents", "/ready-to-apply", "/dashboard"],
    severity: "warning",
  },

  // ── Readiness ─────────────────────────────────────────────────────────────

  readiness_changed: {
    invalidates: ["dashboard", "coach_state", "analytics_cache"],
    recomputes: [],
    routeTemplates: ["/dashboard", "/jobs", "/ready-to-apply"],
    severity: "info",
  },

  // ── Voice integrity ───────────────────────────────────────────────────────

  voice_drift_detected: {
    invalidates: ["quality", "package_review", "readiness", "coach_state"],
    recomputes: ["readiness"],
    routeTemplates: ["/jobs/[id]/documents", "/ready-to-apply"],
    severity: "warning",
  },

  override_logged: {
    invalidates: ["logs"],
    recomputes: [],
    routeTemplates: ["/logs", "/jobs/[id]"],
    severity: "warning",
  },

  // ── Application ───────────────────────────────────────────────────────────

  application_submitted: {
    invalidates: ["readiness", "analytics_cache", "dashboard", "applications", "coach_state"],
    recomputes: [],
    routeTemplates: ["/dashboard", "/jobs", "/applications", "/analytics", "/logs"],
    severity: "info",
  },

  application_failed: {
    invalidates: ["applications"],
    recomputes: [],
    routeTemplates: ["/applications", "/logs"],
    severity: "error",
  },

  outcome_updated: {
    invalidates: ["applications", "analytics_cache", "dashboard", "coach_state"],
    recomputes: [],
    routeTemplates: ["/applications", "/analytics", "/dashboard", "/logs"],
    severity: "info",
  },

  // ── Coach ─────────────────────────────────────────────────────────────────

  coach_action_taken: {
    invalidates: ["coach_state"],
    recomputes: [],
    routeTemplates: [],
    severity: "info",
  },

  // ── Export ────────────────────────────────────────────────────────────────

  export_generated: {
    invalidates: ["logs"],
    recomputes: [],
    routeTemplates: ["/logs"],
    severity: "info",
  },
}

/**
 * Resolve the propagation rule for an event type.
 * Returns a safe default if the event isn't in the map (shouldn't happen).
 */
export function getPropagationRule(eventType: DomainEventType): PropagationRule {
  return INVALIDATION_MAP[eventType] ?? {
    invalidates: [],
    recomputes: [],
    routeTemplates: [],
    severity: "info",
  }
}

/**
 * Substitute [id] template routes with the actual job_id.
 */
export function resolveRoutes(routeTemplates: string[], jobId: string | null): string[] {
  if (!jobId) return routeTemplates.filter(r => !r.includes("[id]"))
  return routeTemplates.map(r => r.replace("[id]", jobId))
}
