<<<<<<< HEAD
# User Facing Communications Validation

This document validates that every user facing communication in HireWire is justified, branded, and has a defined reason.


## Allowed Reasons

- ACCOUNT_ACCESS
- ONBOARDING_GUIDANCE
- JOB_PIPELINE_STATUS
- APPLICATION_PACKAGE_STATUS
- READINESS_AND_BLOCKERS
- COACH_GUIDANCE
- APPLICATION_ACTIONS
- DOCUMENT_AND_EXPORT
- BILLING_AND_PLAN
- ERROR_AND_RECOVERY
- SUPPORT_AND_FEEDBACK
- SYSTEM_AND_PRODUCT_UPDATES
- REMINDERS_AND_DIGESTS
- EXTERNAL_DRAFTS_FOR_USER_APPROVAL

## Validation

- Every communication has reason, tone, audience, channel, priority, next action
- External comms require user approval
- No invented achievements in external comms
- No readiness claims unless proven
- No random copy outside registry
=======
# USER_FACING_COMMS_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
All user-facing strings, empty states, error messages, and notification copy. No placeholder text. No "v0", "App Shell", or generic template copy in production surfaces.

## Findings

### Auth Pages
- Login: "Sign in to HireWire" / "Your career OS is waiting." — branded
- Signup: "Create your HireWire account" / "Build your job search on real evidence." — branded
- Magic link sent: "Sign-in link sent to {email}" — branded, no generic "We sent you a link"
- Signup success: "Confirmation link sent to {email}" — branded
- **Status:** PASS

### Dead Placeholder Copy — Confirmed Removed
- "App Shell" title — removed, replaced with `HireWire — AI-Powered Career OS`
- "Start with a clean auth experience." — removed
- "Framework-only application shell" description — removed
- **Status:** PASS

### Empty States
- Career Context (evidence): Has empty state with CTA
- Jobs list: Has empty state
- Ready Queue: Has empty state
- All dashboard pages: Confirmed to have meaningful empty states — no raw zeros shown
- **Status:** PASS

### Comms Registry
- `lib/comms/reasons.ts`: 14 typed reason constants with channel, priority, and automation rules
- `lib/comms/registry.ts`: 30 pre-registered messages covering all 14 reasons
- `lib/comms/types.ts`: Typed `CommsMessage` interface
- All user-facing notification copy routed through registry — no scattered inline strings
- **Status:** PASS

### Supabase Email Templates
- See `docs/SUPABASE_BRANDING_TASKS.md` for exact HTML templates required
- Auth emails (confirm signup, magic link, password reset) still use Supabase defaults — branded HTML templates must be applied in Supabase dashboard
- **Status:** PENDING — requires Supabase dashboard action (not code)

## Overall: PASS — 0 code issues. Supabase email templates pending dashboard action.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
