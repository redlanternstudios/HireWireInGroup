<<<<<<< HEAD
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
=======
/**
 * HireWire Communication Reason System
 *
 * Every user-facing message, toast, email, modal, or notification
 * must declare one of these reasons. No reason = no communication.
 *
 * Constitution: CLAUDE.md > this file
 */

export const CommunicationReason = {
  ACCOUNT_ACCESS: "ACCOUNT_ACCESS",
  ONBOARDING_GUIDANCE: "ONBOARDING_GUIDANCE",
  JOB_PIPELINE_STATUS: "JOB_PIPELINE_STATUS",
  APPLICATION_PACKAGE_STATUS: "APPLICATION_PACKAGE_STATUS",
  READINESS_AND_BLOCKERS: "READINESS_AND_BLOCKERS",
  COACH_GUIDANCE: "COACH_GUIDANCE",
  APPLICATION_ACTIONS: "APPLICATION_ACTIONS",
  DOCUMENT_AND_EXPORT: "DOCUMENT_AND_EXPORT",
  BILLING_AND_PLAN: "BILLING_AND_PLAN",
  ERROR_AND_RECOVERY: "ERROR_AND_RECOVERY",
  SUPPORT_AND_FEEDBACK: "SUPPORT_AND_FEEDBACK",
  SYSTEM_AND_PRODUCT_UPDATES: "SYSTEM_AND_PRODUCT_UPDATES",
  REMINDERS_AND_DIGESTS: "REMINDERS_AND_DIGESTS",
  EXTERNAL_DRAFTS_FOR_USER_APPROVAL: "EXTERNAL_DRAFTS_FOR_USER_APPROVAL",
} as const

export type CommunicationReason = typeof CommunicationReason[keyof typeof CommunicationReason]

export const CommunicationChannel = {
  IN_APP: "in_app",
  EMAIL: "email",
  TOAST: "toast",
  BANNER: "banner",
  MODAL: "modal",
  COACH: "coach",
  NOTIFICATION: "notification",
  BILLING_PAGE: "billing_page",
  EXTERNAL_DRAFT: "external_draft",
  ERROR_CARD: "error_card",
} as const

export type CommunicationChannel = typeof CommunicationChannel[keyof typeof CommunicationChannel]

export const CommunicationPriority = {
  CRITICAL: "critical",   // blocks user action — must be resolved
  HIGH: "high",           // important but non-blocking
  NORMAL: "normal",       // standard info/status
  LOW: "low",             // soft nudge, optional
} as const

export type CommunicationPriority = typeof CommunicationPriority[keyof typeof CommunicationPriority]

export interface CommunicationReasonDefinition {
  reason: CommunicationReason
  label: string
  description: string
  allowedChannels: CommunicationChannel[]
  defaultPriority: CommunicationPriority
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
  requiresUserApproval: boolean
  canBeAutomated: boolean
  canBeEmail: boolean
  canBeToast: boolean
  canBeCoachGenerated: boolean
  userFacingExamples: string[]
}

<<<<<<< HEAD
export const COMMUNICATION_REASON_META: Record<CommunicationReason, CommunicationReasonMeta> = {
  ACCOUNT_ACCESS: {
    label: 'Account Access',
    description: 'Account creation, verification, access, security, or recovery.',
    allowedChannels: ['email', 'in_app', 'toast', 'modal'],
    defaultPriority: 'high',
=======
export const REASON_DEFINITIONS: Record<CommunicationReason, CommunicationReasonDefinition> = {
  ACCOUNT_ACCESS: {
    reason: "ACCOUNT_ACCESS",
    label: "Account Access",
    description: "Help users create, verify, access, secure, or recover their account.",
    allowedChannels: ["email", "in_app", "toast", "modal"],
    defaultPriority: "high",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Signup confirmation",
      "Magic link sent",
      "Password reset",
      "Email change confirmation",
      "Session expired",
      "Account security notice",
    ],
  },
  ONBOARDING_GUIDANCE: {
    reason: "ONBOARDING_GUIDANCE",
    label: "Onboarding Guidance",
    description: "Help users complete setup and understand what HireWire needs.",
    allowedChannels: ["in_app", "banner", "email"],
    defaultPriority: "normal",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Profile incomplete",
      "Career Context empty",
      "Resume upload needed",
      "First job added",
      "Welcome guidance",
    ],
  },
  JOB_PIPELINE_STATUS: {
    reason: "JOB_PIPELINE_STATUS",
    label: "Job Pipeline Status",
    description: "Tell users what changed in their job pipeline.",
    allowedChannels: ["in_app", "toast", "banner", "notification", "email"],
    defaultPriority: "normal",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Job analyzed",
      "Duplicate job found",
      "Job blocked by scrape",
      "Fit score ready",
      "Evidence mapping needed",
    ],
  },
  APPLICATION_PACKAGE_STATUS: {
    reason: "APPLICATION_PACKAGE_STATUS",
    label: "Application Package Status",
    description: "Tell users what is happening with resume, cover letter, package generation, and approval.",
    allowedChannels: ["in_app", "toast", "banner", "notification", "email"],
    defaultPriority: "high",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Package draft ready",
      "Resume generated",
      "Cover letter generated",
      "Quick questions needed",
      "Red Team review passed",
      "Ready to Apply",
    ],
  },
  READINESS_AND_BLOCKERS: {
    reason: "READINESS_AND_BLOCKERS",
    label: "Readiness and Blockers",
    description: "Explain why something cannot proceed yet and what the next action is.",
    allowedChannels: ["in_app", "banner", "modal", "coach"],
    defaultPriority: "high",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Missing evidence",
      "Missing profile data",
      "Quality review required",
      "Unsupported claims found",
      "Application not ready",
    ],
  },
  COACH_GUIDANCE: {
    reason: "COACH_GUIDANCE",
    label: "Coach Guidance",
    description: "Provide contextual career, pipeline, resume, cover letter, interview, or prioritization help.",
    allowedChannels: ["coach", "in_app"],
    defaultPriority: "normal",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Next best action",
      "Resume strategy",
      "Follow up draft",
      "Interview prep",
      "Pipeline audit",
    ],
  },
  APPLICATION_ACTIONS: {
    reason: "APPLICATION_ACTIONS",
    label: "Application Actions",
    description: "Guide or confirm application related actions.",
    allowedChannels: ["in_app", "toast", "notification", "email"],
    defaultPriority: "normal",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Apply now available",
      "Application marked submitted",
      "Follow up due",
      "Interview prep ready",
      "Application outcome logged",
    ],
  },
  DOCUMENT_AND_EXPORT: {
    reason: "DOCUMENT_AND_EXPORT",
    label: "Document and Export",
    description: "Guide document viewing, editing, exporting, and sharing.",
    allowedChannels: ["in_app", "toast", "email"],
    defaultPriority: "normal",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Resume export ready",
      "Cover letter export ready",
      "Export failed",
      "Document version updated",
    ],
  },
  BILLING_AND_PLAN: {
    reason: "BILLING_AND_PLAN",
    label: "Billing and Plan",
    description: "Communicate subscription, usage, upgrade, limits, receipts, failed payments, cancellations.",
    allowedChannels: ["in_app", "modal", "email", "billing_page"],
    defaultPriority: "high",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Generation limit reached",
      "Upgrade required",
      "Payment failed",
      "Subscription updated",
      "Plan changed",
    ],
  },
  ERROR_AND_RECOVERY: {
    reason: "ERROR_AND_RECOVERY",
    label: "Error and Recovery",
    description: "Explain failures in a calm, actionable, branded way.",
    allowedChannels: ["in_app", "toast", "error_card", "email"],
    defaultPriority: "high",
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      "AI provider failed",
      "Job board blocked fetch",
      "Database save failed",
      "Auth expired",
      "Unknown error with correlation ID",
    ],
  },
  SUPPORT_AND_FEEDBACK: {
    reason: "SUPPORT_AND_FEEDBACK",
    label: "Support and Feedback",
    description: "Help users contact support, report issues, or submit feedback.",
    allowedChannels: ["in_app", "email"],
    defaultPriority: "normal",
    requiresUserApproval: false,
    canBeAutomated: false,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
      "Support request created",
      "Bug report received",
      "Feedback submitted",
    ],
  },
  SYSTEM_AND_PRODUCT_UPDATES: {
    reason: "SYSTEM_AND_PRODUCT_UPDATES",
    label: "System and Product Updates",
    description: "Announce meaningful product changes without spamming users.",
    allowedChannels: ["email", "in_app", "banner"],
    defaultPriority: "low",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "New feature available",
      "Maintenance notice",
      "Policy update",
      "Security related update",
    ],
  },
  REMINDERS_AND_DIGESTS: {
    reason: "REMINDERS_AND_DIGESTS",
    label: "Reminders and Digests",
    description: "Nudge users about work they asked to track.",
    allowedChannels: ["notification", "email"],
    defaultPriority: "low",
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
<<<<<<< HEAD
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
=======
      "Follow up reminder",
      "Interview reminder",
      "Application aging reminder",
      "Weekly pipeline summary",
    ],
  },
  EXTERNAL_DRAFTS_FOR_USER_APPROVAL: {
    reason: "EXTERNAL_DRAFTS_FOR_USER_APPROVAL",
    label: "External Drafts for User Approval",
    description: "Prepare external communications for the user to review, edit, copy, or send.",
    allowedChannels: ["in_app", "external_draft"],
    defaultPriority: "normal",
    requiresUserApproval: true,
    canBeAutomated: false,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
      "Recruiter follow up draft",
      "Thank you note draft",
      "Salary negotiation opening",
      "Withdrawal message",
    ],
  },
}

/**
 * Validate that a reason is defined. Throws at dev time if unknown reason is used.
 */
export function requireReason(reason: string): CommunicationReason {
  if (!(reason in REASON_DEFINITIONS)) {
    throw new Error(
      `[HireWire Comms] Unknown communication reason: "${reason}". ` +
      `All user-facing communications must declare a valid reason from CommunicationReason.`
    )
  }
  return reason as CommunicationReason
}
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
