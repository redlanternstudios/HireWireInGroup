# Project Claude AI OS Constitution

Operational memory for HireWire AI sessions.

This file is intentionally compressed: enough to guide every session, lean enough to load by default.

## Final Commandment

Do not let AI tools improvise the operating system.

Every session must know:

- which tool should do the work
- which files are protected
- what context must load
- what must not be touched
- what verification proves completion
- where the handoff goes next

## Five Enforcement Rules

1. Read the repo constitution before action: `CLAUDE.md`.
2. Respect protected files and routes before editing.
3. Use the right tool for the job.
4. Keep one source of truth for each system.
5. End every build with verification, risk notes, and rollback notes.

## Tool Routing

| Work Type | Primary Tool | Notes |
| --- | --- | --- |
| Product philosophy and operating decisions | ChatGPT / Noor | Decide direction before implementation |
| Repo implementation | VS Code / Codex | Make scoped code changes |
| Code review and critique | Claude | Review diffs, find risks, enforce constitution |
| UI generation and screen drafts | v0 | Design only from verified backend state |
| Supabase schema design | VS Code + Supabase | Migration first, then app code |
| High-risk protected-file edits | Claude review before/after | Require explicit scope |

## Decision Tree Before Any AI Session

1. Is this a product decision, implementation, review, UI design, or schema change?
2. Is the requested work already represented in the repo?
3. Which files/routes/APIs/tables are touched?
4. Is any protected file involved?
5. Is there an existing command in `.claude/commands/`?
6. What upstream inputs feed this change?
7. What downstream outputs depend on this change?
8. What verification proves it works?

## Top Burn Patterns

Ranked by risk:

1. Building new UI before proving the existing flow.
2. Adding a second readiness engine.
3. Adding a second apply path.
4. Letting evidence writes bypass domain events.
5. Treating mock UI as working product.
6. Changing Supabase schema outside migrations.
7. Editing protected files without a narrow plan.
8. Using v0 to invent backend behavior.
9. Running broad refactors during stabilization.

## Context Engineering

Auto-load:

- `CLAUDE.md`
- `MEMORY.md`
- `memory/project_claude_ai_os_constitution.md`
- `.claude/context/product.md`
- `.claude/context/architecture.md`
- `.claude/context/protected-files.md`

Load on demand:

- `.claude/context/routes.md`
- `.claude/context/data-contracts.md`
- `.claude/context/verification.md`
- `.agent/*`
- docs under `docs/`

Avoid loading long historical audits unless the task explicitly asks for history.

## Slash Commands

The active project commands are:

- `/project:truth-audit`
- `/project:readiness-engine-audit`
- `/project:prove-fit-audit`
- `/project:supabase-audit`
- `/project:api-route-audit`
- `/project:component-audit`
- `/project:button-handler-audit`
- `/project:package-audit`
- `/project:v0-handoff`
- `/project:build-day`
- `/project:build-day-prompt`
- `/project:health-check`
- `/project:convergence-check`
- `/project:keymon-setup`
- `/project:review-diff`

Use audit commands before changing architecture.

## Subagent Roster

| Role | Best Tool/Model | Responsibility |
| --- | --- | --- |
| Noor / Product Owner | ChatGPT | Product truth, prioritization, acceptance |
| Builder | Codex in VS Code | Scoped implementation |
| Reviewer | Claude | Diff review, risk detection, constitution enforcement |
| Designer | v0 | UI drafts from verified constraints |
| Database steward | Supabase + Codex | Migration and RLS verification |

## Hooks Enforcement

| Trigger | Required Behavior |
| --- | --- |
| Protected file edit | Pause, inspect dependencies, confirm scope |
| Migration request | Create idempotent migration only |
| Apply flow change | Verify `/ready-to-apply` and `lib/actions/apply.ts` |
| Readiness change | Verify `lib/readiness/evaluator.ts` remains canonical |
| Generation change | Verify evidence grounding and quality gate |
| v0 handoff | State what backend behavior exists and what does not |

## Session Rules

- One builder at a time.
- Do not overwrite user changes.
- Do not expand scope silently.
- Do not claim completion without verification.
- Do not let a visual feature imply an unwired backend capability.
- Always report changed files.
- Always report commands run.
- Always report residual risk.

## Worktree Pattern

1. Inspect status.
2. Read constitution/context.
3. Inspect relevant files.
4. Plan narrowly.
5. Patch only scoped files.
6. Run verification.
7. Summarize changes, risks, and rollback.

## Lean CLAUDE.md Structure

`CLAUDE.md` should remain the repo constitution, not a giant archive.

Detailed operational material belongs in:

- `.claude/context/`
- `.claude/commands/`
- `memory/`
- `.agent/`
- `docs/`

## Key Operating Rules

- HireWire is an Application Readiness Engine.
- Prove Fit is the core loop.
- Match Interview is the user-facing coach moment.
- Hide database machinery from primary user flows.
- Generate only from confirmed, auto-mapped, or explicitly skipped proof.
- Apply only through the readiness gate or an explicitly logged override.

## Emergency Low Usage Mode

When model/tool usage is constrained:

1. Stop broad exploration.
2. Read only the exact file needed.
3. Make no code changes unless requested.
4. Produce a handoff with file refs and next command.
5. Prefer audit summaries over implementation.

## v0 -> Claude -> VS Code Pipeline

1. VS Code or Claude verifies current backend reality.
2. v0 designs only against verified data/actions.
3. VS Code implements the screen.
4. Claude reviews the diff.
5. Noor approves product truth.

## Plan Decision Matrix

| Situation | Action |
| --- | --- |
| User asks to audit | Do not edit; produce file-referenced truth |
| User asks to build | Implement scoped change and verify |
| User asks for v0 | Produce constrained prompt from actual code |
| User asks for Supabase | Check migrations/schema/RLS first |
| User asks for review | Findings first; no fixes unless approved |
| User asks broad strategy | Clarify product decision and sequence |
