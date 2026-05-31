# GitHub PR Handoff - Build Day 25

## Title

`fix: centralize prove fit unresolved requirement logic`

## Summary

- Added one shared unresolved-requirements helper for Prove Fit/readiness behavior.
- Migrated readiness, job detail, Prove Fit page, and generation blocked-response paths to the shared helper.
- Added a stable drawer-readable `GET /api/jobs/[id]/evidence-map` contract.
- Tightened proof coverage so stale cached `confirmed` values do not resolve requirements without `prove_fit_decisions` authority.
- Added focused tests for confirmed, auto-mapped, skipped, and stale-confirmed decision states.

## Supabase Alignment

- No migrations added.
- No schema changes required.
- New read path uses `requireUser()`.
- Job reads remain scoped by `.eq("user_id", userId)`.
- Job reads retain `.is("deleted_at", null)` where applicable.
- `prove_fit_decisions` reads are scoped by authenticated `userId` and `jobId`.
- No client-provided `user_id` is trusted.

## API Contract Added

`GET /api/jobs/[id]/evidence-map`

Returns:

```json
{
  "success": true,
  "matching_complete": true,
  "blocked_requirements": [
    {
      "id": "requirement_id",
      "text": "Requirement text",
      "status": "gap",
      "priority": "required"
    }
  ],
  "first_unresolved_requirement_id": "requirement_id",
  "next_action": {
    "label": "Prove Fit",
    "href": "/jobs/job_id/evidence-match?req=requirement_id#req-requirement_id",
    "description": "Confirm or skip the claims HireWire cannot verify yet."
  }
}
```

## Reviewer Focus

- Confirm stale cached `confirmed` cannot mark a requirement resolved without a matching `prove_fit_decisions` row.
- Confirm `auto_mapped` and `skipped` remain resolved.
- Confirm generation and apply semantics did not drift.
- Confirm the drawer contract is safe for v0 to consume without local readiness logic.
- Confirm tenant scoping on the new `GET` route.

## Verification

- `node --env-file-if-exists=.env.test --import tsx --test tests/unresolved-requirements.test.ts tests/proof-coverage-decisions.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

All passed in the Codex run.

## Known Notes

- `.agent/V0_LIVE_HANDOFF.md` has been refreshed for v0.
- `.agent/V0_PROMPT_BUILD_DAY_25_ALIGNMENT.md` contains the paste-ready v0 prompt.
- Existing generated/agent files are included as operating-layer artifacts, not product runtime changes.
