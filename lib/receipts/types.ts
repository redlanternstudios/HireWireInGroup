export type HireWireReceiptType =
  | "domain_event.persisted"
  | "domain_event.fallback_persisted"
  | "agent.gate_verified"

export type HireWireReceiptInput = {
  userId: string
  jobId?: string | null
  domainEventId?: string | null
  receiptType: HireWireReceiptType | string
  action: string
  details: Record<string, unknown>
  parentReceiptId?: string | null
  submittedBy?: string | null
  delegationLevel?: string | null
  metadata?: Record<string, unknown>
}

export type HireWireReceiptWriteResult = {
  receiptId: string
  verificationHash: string
}
