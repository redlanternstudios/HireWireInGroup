/**
 * Invalidation Map
 *
 * Defines which Next.js cache paths must be revalidated when a domain event fires.
 * All revalidation is tag-based — never revalidate individual paths here.
 * Components that want to react to events use revalidatePath at the page level.
 *
 * Convention: tags use the pattern "job:{jobId}" or "user:{userId}".
 */

import type { DomainEventType } from "./types"

export type InvalidationTarget =
  | { kind: "path"; path: string }
  | { kind: "tag"; tag: string }

/**
 * For each domain event type, return the set of paths/tags to invalidate.
 * This function is called by handleDomainEvent after the event is persisted.
 */
export function getInvalidationTargets(
  eventType: DomainEventType,
  jobId: string,
  userId: string
): InvalidationTarget[] {
  const jobDetail: InvalidationTarget = { kind: "path", path: `/jobs/${jobId}` }
  const jobDocuments: InvalidationTarget = { kind: "path", path: `/jobs/${jobId}/documents` }
  const jobList: InvalidationTarget = { kind: "path", path: `/jobs` }
  const dashboard: InvalidationTarget = { kind: "path", path: `/dashboard` }
  const coach: InvalidationTarget = { kind: "path", path: `/coach` }
  const readyQueue: InvalidationTarget = { kind: "path", path: `/ready-queue` }
  const logs: InvalidationTarget = { kind: "path", path: `/logs` }

  switch (eventType) {
    case "job.analyzed":
    case "job.re_analyzed":
      // Analysis populates qualifications_required + responsibilities on the jobs row
      // which drives the workflow stepper — invalidate detail + list + dashboard
      return [jobDetail, jobList, dashboard, logs]

    case "job.analysis_failed":
      return [jobDetail, logs]

    case "job.scored":
      return [jobDetail, jobList, dashboard]

    case "job.generation_started":
      return [jobDetail, jobDocuments]

    case "job.generation_complete":
      // Documents are now available — invalidate the documents page and all pipeline views
      return [jobDetail, jobDocuments, jobList, dashboard, readyQueue, logs]

    case "job.generation_failed":
      return [jobDetail, jobDocuments, logs]

    case "package.accepted":
      // Package acceptance unlocks the apply action — invalidate everything downstream
      return [jobDetail, jobDocuments, readyQueue, dashboard]

    case "package.needs_review":
    case "package.reset":
      return [jobDetail, jobDocuments, readyQueue]

    case "job.applied":
      return [jobDetail, jobList, dashboard, readyQueue, coach, logs]

    case "job.archived":
    case "job.status_changed":
      return [jobDetail, jobList, dashboard]

    case "job.quality_passed":
      return [jobDetail, jobDocuments, readyQueue]

    case "job.quality_failed":
      return [jobDetail, jobDocuments]

    default:
      return [jobDetail]
  }
}
