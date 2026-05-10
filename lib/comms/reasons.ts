// HireWire — Communication Reason Enums and Metadata

export type CommunicationReason =
  | 'ACCOUNT_ACCESS'
  | 'ONBOARDING_GUIDANCE'
  | 'JOB_PIPELINE_STATUS'
  | 'APPLICATION_PACKAGE_STATUS'
  | 'READINESS_AND_BLOCKERS'
  | 'COACH_GUIDANCE'
  | 'APPLICATION_ACTIONS'
  | 'DOCUMENT_AND_EXPORT'
  | 'BILLING_AND_PLAN'
  | 'ERROR_AND_RECOVERY'
  | 'SUPPORT_AND_FEEDBACK'
  | 'SYSTEM_AND_PRODUCT_UPDATES'
  | 'REMINDERS_AND_DIGESTS'
  | 'EXTERNAL_DRAFTS_FOR_USER_APPROVAL'

export interface CommunicationReasonMeta {
  label: string
  description: string
  allowedChannels: string[]
  defaultPriority: 'low' | 'normal' | 'high' | 'critical'
  requiresUserApproval: boolean
  canBeAutomated: boolean
  canBeEmail: boolean
  canBeToast: boolean
  canBeCoachGenerated: boolean
  userFacingExamples: string[]
}

export const COMMUNICATION_REASON_META: Record<CommunicationReason, CommunicationReasonMeta> = {
  ACCOUNT_ACCESS: {
    label: 'Account Access',
    description: 'Account creation, verification, access, security, or recovery.',
    allowedChannels: ['email', 'in_app', 'toast', 'modal'],
    defaultPriority: 'high',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Signup confirmation',
      'Magic link',
      'Password reset',
      'Session expired',
      'Account security notice',
    ],
  },
  ONBOARDING_GUIDANCE: {
    label: 'Onboarding Guidance',
    description: 'Help users complete setup and understand what HireWire needs.',
    allowedChannels: ['in_app', 'banner', 'email'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
      'Profile incomplete',
      'Career Context empty',
      'Resume upload needed',
      'First job added',
    ],
  },
  JOB_PIPELINE_STATUS: {
    label: 'Job Pipeline Status',
    description: 'Notify users about changes in their job pipeline.',
    allowedChannels: ['in_app', 'toast', 'banner', 'notification', 'email'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Job analyzed',
      'Duplicate job found',
      'Job blocked by scrape',
      'Fit score ready',
    ],
  },
  APPLICATION_PACKAGE_STATUS: {
    label: 'Application Package Status',
    description: 'Status of resume, cover letter, package generation, review, approval.',
    allowedChannels: ['in_app', 'toast', 'banner', 'notification', 'email'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Package draft ready',
      'Resume generated',
      'Cover letter generated',
      'Red Team review passed',
      'User approval required',
    ],
  },
  READINESS_AND_BLOCKERS: {
    label: 'Readiness and Blockers',
    description: 'Explain blockers and next actions.',
    allowedChannels: ['in_app', 'banner', 'modal', 'coach'],
    defaultPriority: 'high',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
      'Missing evidence',
      'Quality review required',
      'Unsupported claims found',
    ],
  },
  COACH_GUIDANCE: {
    label: 'Coach Guidance',
    description: 'Contextual career, pipeline, resume, interview, or prioritization help.',
    allowedChannels: ['chat', 'in_app', 'panel'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
      'Next best action',
      'Resume strategy',
      'Interview prep',
    ],
  },
  APPLICATION_ACTIONS: {
    label: 'Application Actions',
    description: 'Guide or confirm application actions.',
    allowedChannels: ['in_app', 'toast', 'notification', 'email'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Apply now available',
      'Application marked submitted',
      'Follow up due',
    ],
  },
  DOCUMENT_AND_EXPORT: {
    label: 'Document and Export',
    description: 'Guide document viewing, editing, exporting, and sharing.',
    allowedChannels: ['in_app', 'toast', 'email'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Resume export ready',
      'Cover letter export ready',
      'Export failed',
    ],
  },
  BILLING_AND_PLAN: {
    label: 'Billing and Plan',
    description: 'Subscription, usage, upgrade, receipts, failed payments, cancellations.',
    allowedChannels: ['in_app', 'modal', 'email', 'billing'],
    defaultPriority: 'high',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Generation limit reached',
      'Upgrade required',
      'Payment failed',
      'Subscription updated',
    ],
  },
  ERROR_AND_RECOVERY: {
    label: 'Error and Recovery',
    description: 'Explain failures in a calm, actionable, branded way.',
    allowedChannels: ['in_app', 'toast', 'error_card', 'email'],
    defaultPriority: 'critical',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'AI provider failed',
      'Database save failed',
      'Auth expired',
      'Unknown error',
    ],
  },
  SUPPORT_AND_FEEDBACK: {
    label: 'Support and Feedback',
    description: 'Help users contact support, report issues, or submit feedback.',
    allowedChannels: ['in_app', 'email'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Support request created',
      'Bug report received',
      'Feedback submitted',
    ],
  },
  SYSTEM_AND_PRODUCT_UPDATES: {
    label: 'System and Product Updates',
    description: 'Announce meaningful product changes.',
    allowedChannels: ['email', 'in_app', 'banner'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'New feature available',
      'Maintenance notice',
      'Policy update',
    ],
  },
  REMINDERS_AND_DIGESTS: {
    label: 'Reminders and Digests',
    description: 'Nudge users about work they asked to track.',
    allowedChannels: ['notification', 'email', 'push', 'sms'],
    defaultPriority: 'normal',
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Follow up reminder',
      'Interview reminder',
      'Weekly pipeline summary',
    ],
  },
  EXTERNAL_DRAFTS_FOR_USER_APPROVAL: {
    label: 'External Drafts for User Approval',
    description: 'Prepare external comms for user review, edit, copy, or send.',
    allowedChannels: ['in_app_preview', 'external_email_draft', 'copyable_text'],
    defaultPriority: 'normal',
    requiresUserApproval: true,
    canBeAutomated: false,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
      'Recruiter follow up',
      'Referral request',
      'Thank you note',
      'Interview confirmation',
      'Salary negotiation',
    ],
  },
}
