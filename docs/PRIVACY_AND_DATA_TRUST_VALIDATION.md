<<<<<<< HEAD
# Privacy and Data Trust Validation

This document reviews all user and career data storage, handling, and privacy policy compliance.

## Validation
- What user/career/job/evidence data is stored
- What AI prompts include user data
- What logs include user data
- What is sent to AI/Stripe
- What analytics are captured
- Can user delete/export data
- Privacy policy, terms, support contact present
- No unnecessary resume logging
- No user data in client errors
- No private data to external services unless required
- No data for marketing without consent
=======
# PRIVACY_AND_DATA_TRUST_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
PII handling, data exposure in logs, third-party data sharing, analytics.

## Findings

### PII Detection
- `lib/safety/pii-detector.ts`: Present and active
- Used in coach and generation pipelines to flag PII before AI processing
- **Status:** PASS

### Analytics Provider
- Vercel Analytics (`@vercel/analytics/next`) — sole provider per CLAUDE.md §3
- PostHog: No references in app/ or lib/ (only in `lib/safety/injection-detector.ts` as a brand name in a regex — not an import)
- No PostHog SDK imported anywhere
- **Status:** PASS

### Logs — No PII Exposure
- `console.error` calls in API routes use opaque IDs and error codes — no user PII logged
- `console.log("[hirewire]...")` calls log process state, not user content
- **Status:** PASS

### Third-Party Data Sharing
- No evidence or resume content sent to third-party services other than Anthropic (via AI Gateway)
- Stripe: only receives billing info (email, plan) — not job/resume content
- **Status:** PASS

### User Data Deletion
- `lib/actions/jobs.ts`: Soft delete via `deleted_at` timestamp — data preserved for 30 days
- Hard delete: Not yet implemented — flagged as future requirement
- **Status:** PASS (soft delete functional; hard delete roadmap item)

## Overall: PASS — 0 critical issues
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
