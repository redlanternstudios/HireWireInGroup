# Acceptance Criteria — Generation Integrity (anti-fabrication)

Full plan: `docs/ops/GENERATION_INTEGRITY_PLAN.md`. All criteria must PASS.
Per `docs/PROOF_STANDARD.md`, each PASS requires attached live evidence.
(Supersedes the Build Day 16 sheet — that sprint shipped; see git history.)

## AC-0: PR #133 landed first
**Pass:** the fit gate (`FIT_THRESHOLD=70`, 409 `fit_below_threshold`) and Prove
Fit surface are on main, rebased, with its tests green and one live generation
verified. **Test:** merged PR + live 409 on a below-threshold job without
`override:true`.

## AC-1: No unresolvable evidence citations survive
**Pass:** every experience bullet in a persisted resume carries a
`source_evidence_id` that resolves to an evidence record that was passed into
the prompt. Bullets that fail are removed and reported, never persisted.
**Fail:** any persisted bullet whose ID resolves to "Unknown".
**Test:** P6 fixture + one live generation inspected via DB read-back.

## AC-2: Competencies intersect evidenced skills
**Pass:** every listed competency/skill appears (case-insensitive) in the union
of the user's evidenced `skills`/`tools_used`.
**Test:** P6 fixture asserts zero out-of-evidence competencies.

## AC-3: Structure gate
**Pass:** all experience bullets sit under an employer+title+date block derived
from evidence; no floating sections (e.g. "Additional Relevant Experience").
**Test:** P6 fixture parses generated structure and asserts zero floating bullets.

## AC-4: Gaps excluded from the generation objective
**Pass:** requirements with status `gap` are absent from the generation prompt's
objective, and the "acknowledge gaps indirectly" instruction is gone. Gap items
appear in the user-facing gap report instead.
**Test:** unit test on prompt construction + live generation on a job with a
known gap → gap appears in report, not in resume.

## AC-5: Date-math gate
**Pass:** total dated experience is computed from evidence `date_range`s
(non-overlapping, never rounded up); a years-requirement exceeding it becomes a
`gap`. **Test:** unit tests incl. overlap + unparseable ranges; fixture job
requiring more years than the fixture evidence has → requirement lands in the
gap report.

## AC-6: Mirroring cap
**Pass:** summary trigram overlap with the job post < 0.35 after at most one
regeneration; residual violations flagged visibly.
**Test:** unit test on the scorer + fixture assertion.

## AC-7: Regression fixture is the gate
**Pass:** `tests/generation-integrity.test.ts` exists, fails against
pre-change generation behavior, passes post-change, and runs in
`test:e2e:all`. **Test:** run it against both states and attach both outputs.

## AC-8: Standard verification
**Pass:** `npx tsc --noEmit`, `npm run lint`, `npm run build` all green;
`npm run agent:preflight` passes; no changes to `lib/actions/apply.ts`,
ready-to-apply, or `lib/supabase/**`.
