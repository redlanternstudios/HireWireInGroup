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
  requiresUserApproval: boolean
  canBeAutomated: boolean
  canBeEmail: boolean
  canBeToast: boolean
  canBeCoachGenerated: boolean
  userFacingExamples: string[]
}

export const REASON_DEFINITIONS: Record<CommunicationReason, CommunicationReasonDefinition> = {
  ACCOUNT_ACCESS: {
    reason: "ACCOUNT_ACCESS",
    label: "Account Access",
    description: "Help users create, verify, access, secure, or recover their account.",
    allowedChannels: ["email", "in_app", "toast", "modal"],
    defaultPriority: "high",
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: false,
    canBeToast: false,
    canBeCoachGenerated: true,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: true,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
    requiresUserApproval: false,
    canBeAutomated: true,
    canBeEmail: true,
    canBeToast: false,
    canBeCoachGenerated: false,
    userFacingExamples: [
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
