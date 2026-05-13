/**
 * lib/events — Domain Events public API
 *
 * Import from here, never from sub-files directly.
 */

export { handleDomainEvent } from "./handler"
export { getInvalidationTargets } from "./invalidation-map"
export {
  DOMAIN_EVENT_TYPES,
  type DomainEvent,
  type DomainEventType,
  type JobAnalyzedPayload,
  type JobScoredPayload,
  type GenerationStartedPayload,
  type GenerationCompletePayload,
  type GenerationFailedPayload,
  type PackageAcceptedPayload,
  type PackageNeedsReviewPayload,
  type JobAppliedPayload,
  type JobStatusChangedPayload,
} from "./types"
