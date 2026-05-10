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
}
