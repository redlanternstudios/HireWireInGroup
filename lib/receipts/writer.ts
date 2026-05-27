import type { createClient } from "@/lib/supabase/server"
import type { DomainEvent } from "@/lib/domain-events/event-types"
import { createVerificationHash } from "./hash"
import type { HireWireReceiptInput, HireWireReceiptWriteResult } from "./types"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export async function writeHireWireReceipt(
  supabase: ServerSupabase,
  input: HireWireReceiptInput,
): Promise<HireWireReceiptWriteResult | null> {
  const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const details = input.details ?? {}
  const metadata = input.metadata ?? {}
  const payloadForHash = {
    receipt_id: receiptId,
    user_id: input.userId,
    job_id: input.jobId ?? null,
    domain_event_id: input.domainEventId ?? null,
    receipt_type: input.receiptType,
    action: input.action,
    details,
    parent_receipt_id: input.parentReceiptId ?? null,
    submitted_by: input.submittedBy ?? input.userId,
    delegation_level: input.delegationLevel ?? null,
    metadata,
  }
  const verificationHash = createVerificationHash(payloadForHash)

  const { error } = await supabase.from("hirewire_receipts").insert({
    receipt_id: receiptId,
    user_id: input.userId,
    job_id: input.jobId ?? null,
    domain_event_id: input.domainEventId ?? null,
    receipt_type: input.receiptType,
    action: input.action,
    details,
    verification_hash: verificationHash,
    parent_receipt_id: input.parentReceiptId ?? null,
    submitted_by: input.submittedBy ?? input.userId,
    delegation_level: input.delegationLevel ?? null,
    metadata,
  })

  if (error) return null

  return {
    receiptId,
    verificationHash,
  }
}

export function buildDomainEventReceiptInput(
  event: DomainEvent,
  receiptType: "domain_event.persisted" | "domain_event.fallback_persisted",
): HireWireReceiptInput {
  return {
    userId: event.user_id,
    jobId: event.job_id,
    domainEventId: receiptType === "domain_event.persisted" ? event.event_id : null,
    receiptType,
    action: event.event_type,
    details: {
      event_id: event.event_id,
      event_type: event.event_type,
      source: event.source,
      severity: event.severity,
      invalidates: event.invalidates,
      recomputes: event.recomputes,
      affected_routes: event.affected_routes,
      payload_keys: Object.keys(event.payload ?? {}).sort(),
      emitted_at: event.timestamp,
    },
    metadata: {
      source: "domain_events",
      receipt_schema_version: "1.0.0",
    },
  }
}

export async function writeDomainEventReceipt(
  supabase: ServerSupabase,
  event: DomainEvent,
  receiptType: "domain_event.persisted" | "domain_event.fallback_persisted",
): Promise<void> {
  try {
    await writeHireWireReceipt(supabase, buildDomainEventReceiptInput(event, receiptType))
  } catch {
    // Receipts prove the path; they must not break the user mutation path.
  }
}
