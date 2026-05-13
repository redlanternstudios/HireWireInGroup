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
