<<<<<<< HEAD
# Upstream Input Validation

This document reviews all upstream inputs to HireWire, their trustworthiness, provenance, editability, and risk of hallucination or unsupported claims.

## Inputs


### 1. User Account Data

- Source: Supabase Auth, user_profile
- Trust: High (tenant isolated, RLS enforced)
- Null/Malformed: Possible if incomplete signup
- Tenant Isolated: Yes
- User Approved: Yes
- Editable: Yes (profile)
- Hallucination Risk: Low
- Unsupported Claims: No
- Storage: Secure, Postgres
- Provenance: Auth events, profile edits

### 2. Career Context

- Source: evidence_library, source_resumes, user_profile, LinkedIn/manual imports
- Trust: Medium-High (user input, parsing, deduplication)
- Null/Malformed: Possible (bad parse, empty import)
- Tenant Isolated: Yes
- User Approved: Yes (is_user_approved flag)
- Editable: Yes
- Hallucination Risk: Medium (bad parse, user error)
- Unsupported Claims: Possible if not flagged
- Storage: Secure, Postgres
- Provenance: Resume import, manual entry, LinkedIn import

### 3. Job Intake

- Source: job URL, manual description, scrape, job board
- Trust: Medium (scrape can fail or be spoofed)
- Null/Malformed: Yes (bad URL, failed scrape)
- Tenant Isolated: Yes
- User Approved: Yes (manual edit)
- Editable: Yes
- Hallucination Risk: Medium (scrape errors)
- Unsupported Claims: Possible if not flagged
- Storage: Secure, Postgres
- Provenance: Intake event, scrape log

### 4. AI Inputs

- Source: Prompts for analysis, generation, coach, quality, package, humanizer, red team
- Trust: Medium (prompt injection risk, model drift)
- Null/Malformed: Yes (bad prompt, model error)
- Tenant Isolated: Yes (context filtered)
- User Approved: Yes (review step)
- Editable: No (system prompts)
- Hallucination Risk: Medium-High (AI risk)
- Unsupported Claims: Possible if not grounded
- Storage: Not stored unless output
- Provenance: Prompt logs

### 5. System Inputs

- Source: Stripe, auth, usage, audit, analytics
- Trust: High (system events)
- Null/Malformed: Possible (webhook error)
- Tenant Isolated: Yes
- User Approved: N/A
- Editable: No
- Hallucination Risk: None
- Unsupported Claims: No
- Storage: Secure, Postgres
- Provenance: Event logs
=======
# UPSTREAM_INPUT_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
All user input entry points: job URL paste, LinkedIn PDF upload, resume upload, manual evidence entry, coach chat, profile fields.

## Findings

### Job URL / Job Description Input
- **Route:** `app/api/analyze/route.ts`
- **Auth:** `supabase.auth.getUser()` — user checked, redirects on null
- **Input validation:** Job description text extracted and passed to `lib/analyze/analyze-job-core.ts`
- **Injection safety:** Coach prompt injection covered by `lib/safety/injection-detector.ts`
- **Status:** PASS

### LinkedIn PDF Upload
- **Route:** `app/api/linkedin/import/route.ts`
- **Auth:** Inline `auth.getUser()` — equivalent to `requireUser()`
- **File type guard:** Present — PDF only accepted
- **Duplicate detection:** `lib/duplicate-detection.ts` triggered post-import
- **Status:** PASS

### Resume Upload
- **Route:** `app/api/resumes/` 
- **Column mapping:** Uses `file_name`, `parsed_text`, `file_type` — all correct per CLAUDE.md §8
- **pdfjs:** Removed — not imported anywhere in codebase
- **Status:** PASS

### Manual Evidence Entry
- **Route:** Evidence create API
- **JSONB arrays:** Stored via typed insert — not vulnerable to raw JSONB misparse on write
- **Status:** PASS

### Coach Chat Input
- **Route:** `app/api/coach/route.ts`
- **Injection detection:** 11 regex patterns in route + `lib/safety/injection-detector.ts` for evidence
- **Max length:** 4000 chars per message, 50 message history cap
- **Status:** PASS

### Profile Fields
- **Column mapping:** `website_url` (not `linkedin_url`), `github_url` (not `portfolio_url`) — correct
- **JSONB guards:** `Array.isArray()` used on `skills`, `experience`, `education` before render
- **Status:** PASS

## Overall: PASS — 0 critical issues
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
