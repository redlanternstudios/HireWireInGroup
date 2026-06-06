import type { CommunicationReason, CommunicationChannel, CommunicationPriority } from "./reasons"

export type BrandSurface =
  | "app_shell"
  | "auth"
  | "email"
  | "toast"
  | "banner"
  | "modal"
  | "coach"
  | "notification"
  | "billing"
  | "export"
  | "support"
  | "external_draft"
  | "error_state"

export type CommsTone =
  | "direct"         // clear, no fluff
  | "supportive"     // helpful, warm but not cheesy
  | "urgent"         // action required
  | "informational"  // status update, no action needed
  | "celebratory"    // milestone, success

export type Tone =
  | CommsTone
  | "calm"
  | "strategic"
  | "encouraging"
  | "formal"
  | "warm"
  | "neutral"

export interface CommsMessage {
  /** Unique identifier for this message template */
  id: string
  /** The reason this communication exists — required, no exceptions */
  reason: CommunicationReason
  /** Business domain this belongs to */
  domain: "pipeline" | "application" | "billing" | "account" | "coaching" | "system" | "document" | "support"
  /** Who this message is for */
  audience: "user" | "admin" | "system"
  /** What this message is trying to accomplish */
  intent: string
  /** Where this message appears */
  channel: CommunicationChannel
  /** Brand surface this renders on */
  brandSurface: BrandSurface
  /** Tone of the message */
  tone: CommsTone
  /** Priority level */
  priority: CommunicationPriority
  /** Short headline */
  title: string
  /** Full message body */
  body: string
  /** CTA label if applicable */
  actionLabel?: string
  /** CTA href if applicable */
  actionHref?: string
  /** Whether user must approve before sending */
  requiresApproval: boolean
}

export type CommunicationMessage = {
  id: string
  domain: string
  audience: string
  intent: string
  channel: string
  tone: string
  subject?: string
  title?: string
  body: string
  actionLabel?: string
  actionHref?: string
  requiresApproval?: boolean
  isDraft?: boolean
  createdAt?: string
}
