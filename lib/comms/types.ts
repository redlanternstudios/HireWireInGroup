<<<<<<< HEAD
// Core types for solution-wide communications system

export type CommunicationDomain =
  | 'PRODUCT_UI'
  | 'SYSTEM_STATUS'
  | 'ERROR_RECOVERY'
  | 'AI_COACH'
  | 'NOTIFICATIONS'
  | 'EMAIL_TRANSACTIONAL'
  | 'EMAIL_CAREER_OUTREACH'
  | 'APPLICATION_COMMS'
  | 'INTERVIEW_COMMS'
  | 'BILLING_COMMS'
  | 'SUPPORT_COMMS'
  | 'INTERNAL_ADMIN'
  | 'INTEGRATION_COMMS'

export type AudienceType =
  | 'USER'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'REFERRAL_CONTACT'
  | 'COACH_OR_MENTOR'
  | 'SUPPORT_TEAM'
  | 'SYSTEM_ADMIN'
  | 'BILLING_CONTACT'

export type IntentType =
  | 'INFORM'
  | 'GUIDE'
  | 'WARN'
  | 'CONFIRM'
  | 'REQUEST'
  | 'REMIND'
  | 'ESCALATE'
  | 'SEND_EXTERNAL'
  | 'SUMMARIZE'
  | 'COACH'
  | 'SELL_OR_UPGRADE'

export type Channel =
  | 'in_app'
  | 'toast'
  | 'banner'
  | 'modal'
  | 'email'
  | 'sms'
  | 'push'
  | 'chat'
  | 'external_email'
  | 'exported_text'
  | 'system_log'
  | 'audit_event'

export type Tone =
  | 'calm'
  | 'direct'
  | 'strategic'
  | 'encouraging'
  | 'formal'
  | 'warm'
  | 'urgent'
  | 'neutral'

import type { CommunicationReason } from './reasons'

export type BrandSurface =
  | 'app_shell'
  | 'auth'
  | 'email'
  | 'toast'
  | 'banner'
  | 'modal'
  | 'coach'
  | 'notification'
  | 'billing'
  | 'export'
  | 'support'
  | 'external_draft'
  | 'error_state'

export interface CommunicationMessage {
  id: string
  reason: CommunicationReason
  domain: CommunicationDomain
  audience: AudienceType
  intent: IntentType
  channel: Channel
  tone: Tone
  priority: 'low' | 'normal' | 'high' | 'critical'
  brandSurface: BrandSurface
  subject?: string
  body: string
  actionLabel?: string
  nextAction?: string
  requiresApproval?: boolean
  isDraft?: boolean
  createdAt: string
  updatedAt?: string
  triggeredBy?: string
  relatedEntityId?: string
=======
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
  | "direct"       // clear, no fluff
  | "supportive"   // helpful, warm but not cheesy
  | "urgent"       // action required
  | "informational" // status update, no action needed
  | "celebratory"  // milestone, success

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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
}
