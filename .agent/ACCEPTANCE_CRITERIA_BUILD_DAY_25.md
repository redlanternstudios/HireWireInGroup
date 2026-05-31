# Acceptance Criteria - Build Day 25

All criteria must pass.

## AC-1 Shared Helper Exists
Pass:
- A shared unresolved-requirements helper module exists and is used.

Fail:
- Unresolved requirement logic remains duplicated in multiple consumers.

## AC-2 Canonical Resolution Semantics
Pass:
- confirmed, auto_mapped, and skipped resolve requirements.
- gap, unknown, partial, and no usable packet remain unresolved.

Fail:
- Any mismatch in resolved/unresolved semantics across consumers.

## AC-3 Stale Confirmed Cache Handling
Pass:
- Cached confirmed without prove_fit_decisions authority is treated unresolved.

Fail:
- Cached confirmed is treated resolved without decision-row authority.

## AC-4 Consumer Migration Complete
Pass:
- evaluator and relevant next-action builders use shared helper.

Fail:
- Local unresolved logic remains in active paths.

## AC-5 Drawer Read Contract
Pass:
- A stable read shape exists for UI drawer/sheet consumption with first unresolved requirement and blocked requirements.

Fail:
- UI must recompute unresolved logic locally.

## AC-6 No Generation/Apply Drift
Pass:
- No behavioral changes to generation/apply core paths.

Fail:
- Any regression or logic drift in generation/apply flow.

## AC-7 Auth and User Scoping Preserved
Pass:
- Any changed/added API route uses authenticated user and user_id scoping.

Fail:
- Missing auth enforcement or tenant-scoping.

## AC-8 Verification Passes
Pass:
- npx tsc --noEmit passes.
- npm run lint passes.
- npm run build passes.

Fail:
- Any verification command fails due to this scope.

## AC-9 Completion Summary
Pass:
- Final summary includes changed files, verification output, residual risks, rollback notes.

Fail:
- Missing one or more required closeout sections.
