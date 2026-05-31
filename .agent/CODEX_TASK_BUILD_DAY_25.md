# Codex Task - Build Day 25

## Mission
Complete the Prove Fit logic and test slice while v0 handles visual shell work.

Primary objective:
- Build one shared unresolved-requirements authority.
- Ensure all consumers use the same source of truth.
- Add focused tests for prove-fit decision behavior.

Out of scope:
- No visual redesign.
- No schema changes unless absolutely required.
- Do not alter generation/apply behavior.
- Do not create a second readiness engine or apply path.

## Non-Negotiable Constraints
- Keep readiness authority canonical in lib/readiness/evaluator.ts.
- Keep apply path canonical in lib/actions/apply.ts.
- Keep apply gate canonical in app/(dashboard)/ready-to-apply/page.tsx.
- Preserve generation behavior in app/api/generate-documents/route.ts.
- No destructive git operations.

## Scope Map

### 1. Shared unresolved requirements helper (P0)
Implement a shared helper module that provides:
- listUnresolvedRequirements(jobOrEvidenceMap)
- getFirstUnresolvedRequirementId(jobOrEvidenceMap)
- buildEvidenceFixHref(jobId, requirementId)

Rules the helper must enforce:
- Treat skipped as resolved.
- Treat confirmed as resolved only when backed by prove_fit_decisions authority.
- Treat auto_mapped as resolved.
- Treat gap, unknown, partial, or missing usable packet as unresolved.

Suggested location:
- lib/evidence/unresolved-requirements.ts

### 2. Make current consumers use shared helper (P0)
Update existing consumers so unresolved requirement decisions are not duplicated.

Expected consumer updates:
- lib/readiness/evaluator.ts
- app/(dashboard)/jobs/[id]/page.tsx (if it has local unresolved logic)
- Any API route building Prove Fit next-action links from unresolved requirements

### 3. Add/verify drawer-consumable API shape (P0)
Provide a stable read shape for UI drawer/sheet consumers.

Requirement:
- If a read endpoint already exists with correct shape, verify and document it.
- If not, add a lightweight read route that returns:
  - matching_complete
  - blocked_requirements (id/text/status/priority)
  - first_unresolved_requirement_id
  - next_action

Constraints:
- No change to generation/apply semantics.
- Keep user scoping strict via requireUser + user_id filtering.

### 4. Tests for prove-fit decision states (P0)
Add targeted tests for exactly these scenarios:
- confirmed from prove_fit_decisions
- auto_mapped
- skipped
- stale cached confirmed ignored when decision row is absent

Test style:
- Unit tests for helper behavior first.
- Keep assertions behavioral, not snapshot-heavy.
- Add only tests needed for this slice.

Suggested paths:
- tests/unresolved-requirements.test.ts
- tests/proof-coverage-decisions.test.ts

### 5. Verification and closeout (P0)
Run and report:
- npx tsc --noEmit
- npm run lint
- npm run build

Closeout includes:
- Files changed
- Why each change was needed
- What was verified
- Residual risks
- Rollback notes

## Iteration Plan (Continuous Execution)

### Iteration 0 - Baseline lock
Goal:
- Confirm clean scope and identify exact files to touch.

Actions:
1. Read current implementations for readiness unresolved logic and proof coverage.
2. Capture baseline with git status and current tests status.
3. Write a short implementation checklist before editing.

Exit criteria:
- Exact file list locked.
- No ambiguity about unresolved requirement rules.

### Iteration 1 - Extract shared helper
Goal:
- Implement one reusable unresolved-requirements authority.

Actions:
1. Add helper module with pure functions.
2. Move duplicated logic out of readiness internals.
3. Keep compatibility with current requirement anchor behavior.

Exit criteria:
- Helper compiles.
- Existing behavior remains intact for current paths.

### Iteration 2 - Consumer migration
Goal:
- Replace duplicate local logic with helper usage.

Actions:
1. Update evaluator usage.
2. Update any job detail/API next-action builders using local unresolved checks.
3. Remove dead duplicated utilities.

Exit criteria:
- Single source of unresolved requirement logic is active.
- No regressions in readiness next-action construction.

### Iteration 3 - Drawer contract path
Goal:
- Ensure UI can consume unresolved state without recomputing locally.

Actions:
1. Verify existing read shape or add minimal read route.
2. Return blocked requirements + first unresolved + next action.
3. Keep route auth and user scoping strict.

Exit criteria:
- v0/Codex UI shell can consume one stable data contract.

### Iteration 4 - Focused tests
Goal:
- Lock behavior with the 4 required decision-state tests.

Actions:
1. Add unit tests for helper logic.
2. Add proof decision integration tests around coverage merge behavior.
3. Validate stale confirmed cache behavior.

Exit criteria:
- All required scenarios pass.

### Iteration 5 - Hardening and full verification
Goal:
- Finish cleanly and ship-ready.

Actions:
1. Run full verification commands.
2. Fix only issues introduced by this scope.
3. Produce completion summary and residual risk notes.

Exit criteria:
- tsc, lint, build pass.
- No scope creep.
- Ready for Claude review and v0 handoff.

## Continuous Loop Protocol
For each iteration:
1. Implement smallest patch.
2. Run nearest validation quickly.
3. If failing, fix immediately and re-run.
4. Commit iteration summary in working notes.
5. Advance only when iteration exit criteria are met.

If blocked:
- Stop after 3 unsuccessful fix attempts on the same issue.
- Document blocker, evidence, and minimal fallback.
- Continue with remaining non-blocked subtasks.

## Definition of Done
Done means all are true:
- Shared unresolved helper exists and is the source of truth.
- Consumer logic is migrated and deduplicated.
- Drawer-consumable contract is available and verified.
- Required 4 prove-fit decision scenarios are tested and passing.
- tsc, lint, and build pass.
- Summary includes risks and rollback notes.

## Handoff Targets After Completion
- Claude review prompt: review only this scope for regressions and contract drift.
- v0 prompt: consume only the returned unresolved-requirements contract; no local readiness logic.
