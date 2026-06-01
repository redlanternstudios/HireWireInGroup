# CLAUDE_REVIEW — Phase 0

## Review Metadata

| Field | Value |
|---|---|
| Reviewer | Claude |
| Date | 2026-05-31 |
| Phase | 0 — Stop the Bleeding |
| Verdict | **APPROVED** — with repo hygiene required before Phase 1 |

---

## Acceptance Criteria Check

### P0-T1 — Document Persistence Bug

**PASS — NOT CHURNED**

Codex confirmed current code already writes `generated_resume` and
`generated_cover_letter` outside the `qualityPassed` branch. The e2e finding
where documents persisted as `NULL` appears environmental or tied to an older
runtime state, not a code bug in the current route. Codex correctly avoided
churning working persistence code.

### P0-T2 — `analysis_model` Hardcode

**PASS**

Codex added `getActiveAnalysisModelName()` in `lib/ai/gateway.ts` and updated
`lib/analyze/analyze-job-core.ts` to persist the active configured model instead
of the stale `llama-3.3-70b-versatile` hardcode.

### P0-T3 — `do_not_generate` Hard Return

**PASS**

Codex added the hard return before resume/cover-letter AI calls in
`app/api/generate-documents/route.ts`. It marks the job failed with
`generation_error: "insufficient_evidence"`, logs Supabase write errors, and
returns a 409 with a user-facing message.

### P0-T4 — Recompute Readiness `prove_fit_decisions`

**PASS**

Codex updated `lib/domain-events/recompute-readiness.ts` to fetch
`prove_fit_decisions` scoped by both `jobId` and `userId`, then pass them into
`evaluateReadiness()`. Domain event snapshots can now reflect confirmed Prove
Fit decisions.

### Verification

**PASS**

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

All passed in the Codex Phase 0 run.

---

## Repo Hygiene Gate Before Phase 1

Phase 0 is approved. Before Phase 1 begins, resolve repository hygiene:

1. Local `main` is behind `origin/main` by 5 commits.
2. The working tree contains dirty v0/agent changes unrelated to Phase 0.
3. Build Day 25 files are tracked in this checkout; the older claim that they
   were untracked is stale. Do not treat that note as current truth.

Required before Phase 1:

- Either pull/rebase `origin/main` safely after parking dirty work, or otherwise
  reconcile local `main` with `origin/main`.
- Keep unrelated v0/agent changes intact; do not overwrite them.
- Start Phase 1 from a clean or intentionally parked working tree so
  `dashboard`, `jobs`, `ready-to-apply`, and `apply.ts` changes are isolated.

---

## Notes To Ro

Phase 0 is clean and approved. Codex made the right judgment not to churn the
document persistence path.

Phase 1 is approved to begin only after the hygiene gate above is resolved.
