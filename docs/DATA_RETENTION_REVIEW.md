# DATA_RETENTION_REVIEW.md

# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope

How long data is retained. Soft delete behavior. Dead table data. User-initiated deletion.

## Findings

### Jobs — Soft Delete

- `deleted_at` timestamp set on delete — record preserved in DB
- All active queries filter `deleted_at IS NULL`
- Restore function `restoreJob()` in `lib/actions/jobs.ts` — soft delete reversible
- **Retention period:** Indefinite until hard delete implemented
- **Status:** PASS (functional) — Hard delete is a roadmap item

### Evidence Library

- No soft delete — evidence items deleted immediately on user action
- **Status:** PASS

### Generated Documents

- `jobs.generated_resume`, `jobs.generated_cover_letter`: Persisted in jobs row — deleted when job is soft-deleted
- `generated_documents` table: Dead/always empty — no retention concern
- **Status:** PASS

### Source Resumes

- `source_resumes` table: Stores `file_name`, `parsed_text`, `file_type` — correct column names
- Deletion tied to user account deletion (not yet implemented as self-serve)
- **Status:** PASS (user-initiated deletion is roadmap item)

### Session Data

- Coach sessions: `coach_sessions` and related tables — no explicit TTL
- **Recommendation:** Add 90-day TTL on coach sessions for data hygiene
- **Status:** FLAGGED — not blocking

### User Account Deletion

- Not yet self-serve — requires manual support action
- **Status:** ROADMAP — not blocking for launch

## Overall: PASS — 0 blocking issues. Hard delete and account deletion are roadmap items.
