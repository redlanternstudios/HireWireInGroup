# Supabase Alignment - Build Day 25

## Status

Aligned. No database migration is needed for this slice.

## Tables Read Or Relied On

- `jobs`
- `evidence_library`
- `prove_fit_decisions`
- `job_analyses`
- `job_scores`
- `users`

## Contract Decisions

- `prove_fit_decisions` is the authority for manually confirmed Prove Fit requirements.
- Cached `requirement_matches[].proof_decision = "confirmed"` is not sufficient by itself.
- `auto_mapped` and `skipped` remain resolved from the evidence map.
- Unresolved means `gap`, `unknown`, `partial`, missing usable packet, or stale cached confirmed.

## New Read Path

`GET /api/jobs/[id]/evidence-map`

Supabase safety:
- Uses `requireUser()`.
- Reads `jobs` with `.eq("id", jobId)`, `.eq("user_id", userId)`, and `.is("deleted_at", null)`.
- Reads `prove_fit_decisions` inside `deriveMatchingComplete()` with `.eq("user_id", userId)` and `.eq("job_id", jobId)`.
- Does not accept or trust a client-provided `user_id`.

## No-Drift Guarantees

- No migration files added.
- No RLS policy changes.
- No new tables or columns.
- No apply-path changes.
- No generation success path changes.
- Existing `POST /api/jobs/[id]/evidence-map` behavior is preserved.
