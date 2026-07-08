# HireWire Proof Standard

`npm run agent:verify` (typecheck + lint + build) proves the code compiles. It
does not prove the feature works. This is the gap: a clean build is necessary,
not sufficient, to claim something is fixed or done.

Adapted from Penn Enterprises' `build-ios-apps` skill — same rule as its iOS
proof gates (xcodebuild result, simulator UDID, TestFlight receipt), translated
for a web app: **no claim of "fixed" / "verified" / "done" survives without
live evidence attached**, and that evidence must be *of the specific claim*,
not adjacent to it. This is not new philosophy for HireWire — it's the exact
practice used across the recent onboarding-lockout, resume-parse, and Gemini
migrations (repro the failure live, apply the fix, repro success live, attach
both). This doc makes that practice a declared, checkable requirement instead
of something only some sessions happen to do.

## What counts as proof, by change type

| Change type | Required evidence |
|---|---|
| API route / server logic | An actual request + response (status, body) against a running server. Reading the code and reasoning it should work is not proof. |
| Database / schema / RLS | A live read-back of the real rows/columns/policies (via the Supabase MCP or REST), not the migration file alone. |
| AI / LLM logic (matching, extraction, generation, judges) | A real model call showing correct structured output on a real or realistic input — not just that the schema typechecks. |
| Bug fix | Reproduce the **original failure** first (proves the bug is real), then the **same reproduction succeeding** after the fix. One without the other is not a fix — it's a guess. |
| UI / user flow | A trace through the real flow with real data. Synthetic/self-authored fixtures dressed up as a "real" test are a hard fail if not disclosed as synthetic (see the fallback-parser lesson below). |
| Visual/layout | A screenshot or `preview_inspect` read of the actual rendered element, not a description of the intended CSS. |

## Hard fails

- Claiming "fixed" / "verified" / "done" with no live evidence attached.
- Presenting synthetic or self-authored test data as if it were a representative real-user case, without saying so. (The `parseResumeTextFallback` fix on 2026-07-08 shipped from exactly this: a fallback parser hardcoded to one person's résumé, verified only because that one résumé happened to hit it — any other user got a silent no-op.)
- Reporting a recovery/fallback path as "working" without confirming *why* it fired (e.g. claiming a timeout-triggered fallback recovered from an AI stall, when the real cause was that no AI key was configured at all — a different, unrelated failure mode).
- A receipt whose own evidence contradicts its headline claim (e.g. a `needs_review` / `quality_passed: false` result reported as "generation works").

## Warnings (proceed, but say so)

- Verification run against a local/dev environment only, not staging or prod.
- Evidence gathered once, not re-checked after a subsequent unrelated change touched the same path.
- A "should be equivalent" argument substituting for a direct re-run (acceptable for low-risk, mechanical changes only — e.g. a rename — never for logic changes).

## Where this is enforced

`requiredVerification` in `.agent/policy.json` (and the active task's
`verification` list in `.agent/task.json`) now includes this standard.
`scripts/agent/preflight.mjs` fails if no verification is declared;
`scripts/agent/handoff.mjs` renders the declared verification list directly
into every Codex/Claude handoff prompt, so this flows to whichever agent picks
up the work without new plumbing.
