/**
 * lib/domain-events/index.ts
 *
 * Public API for the domain event system.
 * Import from here, not from sub-modules directly.
 */

export { handleDomainEvent } from "./handle-event"
export { emitDomainEvent, emitDomainEventWithClient } from "./emit-event"
export { getPropagationRule, resolveRoutes, INVALIDATION_MAP } from "./invalidation-map"
export { recomputeReadiness } from "./recompute-readiness"
export type {
  DomainEvent,
  DomainEventInput,
  DomainEventType,
  DomainEventSeverity,
  DomainEventSource,
  InvalidationTarget,
  RecomputeTarget,
  ReadinessSnapshot,
} from "./event-types"
