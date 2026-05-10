# HireWire — User Facing Communication Reasons

This document defines all valid reasons for HireWire to communicate with users. Every user-facing message, notification, or email must map to one of these categories.

## Communication Reason Categories

1. **ACCOUNT_ACCESS**
   - Help users create, verify, access, secure, or recover their account.
   - Examples: Signup confirmation, magic link, password reset, email change, session expired, security notice
   - Channels: email, in_app, toast, modal

2. **ONBOARDING_GUIDANCE**
   - Help users complete setup and understand what HireWire needs.
   - Examples: Profile incomplete, Career Context empty, resume upload needed, first job added, welcome guidance
   - Channels: in_app, banner, email (optional)

3. **JOB_PIPELINE_STATUS**
   - Tell users what changed in their job pipeline.
   - Examples: Job analyzed, duplicate job, job blocked, fit score ready, evidence mapping needed, job archived/restored
   - Channels: in_app, toast, banner, notification, email (important updates)

4. **APPLICATION_PACKAGE_STATUS**
   - Status of resume, cover letter, package generation, review, approval.
   - Examples: Package draft ready, resume generated, cover letter generated, review passed/failed, approval required
   - Channels: in_app, toast, banner, notification, email (important states)

5. **READINESS_AND_BLOCKERS**
   - Explain blockers and next actions.
   - Examples: Missing evidence, profile data, materials, review required, unsupported claims, already applied
   - Channels: in_app, banner, modal, coach

6. **COACH_GUIDANCE**
   - Contextual career, pipeline, resume, interview, or prioritization help.
   - Examples: Next best action, resume strategy, clarifying questions, follow up, interview prep
   - Channels: chat, in_app, panel

7. **APPLICATION_ACTIONS**
   - Guide or confirm application actions.
   - Examples: Apply now, application submitted, follow up due, interview prep ready, status update
   - Channels: in_app, toast, notification, email (optional)

8. **DOCUMENT_AND_EXPORT**
   - Guide document viewing, editing, exporting, sharing.
   - Examples: Resume export ready, cover letter export ready, export failed, document updated
   - Channels: in_app, toast, email (optional)

9. **BILLING_AND_PLAN**
   - Subscription, usage, upgrade, receipts, failed payments, cancellations.
   - Examples: Limit reached, upgrade required, payment failed, subscription updated, receipt available
   - Channels: in_app, modal, email, billing page

10. **ERROR_AND_RECOVERY**
    - Explain failures in a calm, actionable, branded way.
    - Examples: AI provider failed, job board blocked, database save failed, export failed, auth expired, unknown error
    - Channels: in_app, toast, error card, email (severe/support)

11. **SUPPORT_AND_FEEDBACK**
    - Help users contact support, report issues, or submit feedback.
    - Examples: Support request created, bug report received, feedback submitted, support follow up
    - Channels: in_app, email

12. **SYSTEM_AND_PRODUCT_UPDATES**
    - Announce meaningful product changes.
    - Examples: New feature, maintenance, policy update, security update
    - Channels: email, in_app, banner

13. **REMINDERS_AND_DIGESTS**
    - Nudge users about work they asked to track.
    - Examples: Follow up reminder, interview reminder, weekly summary, stale job reminder
    - Channels: notification, email, push/SMS (future)

14. **EXTERNAL_DRAFTS_FOR_USER_APPROVAL**
    - Prepare external comms for user review, edit, copy, or send.
    - Examples: Recruiter follow up, referral request, thank you note, interview confirmation, salary negotiation
    - Channels: in_app preview, external_email draft, copyable text
    - Rules: User approval required, no unsupported claims, no fake status
