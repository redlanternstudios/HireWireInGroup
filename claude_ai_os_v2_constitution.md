# Claude AI OS v2 Constitution

Workspace reference copy.

This is the live markdown counterpart to the compressed memory file:

- `memory/project_claude_ai_os_constitution.md`

The uploaded source `.docx` was not present in this VS Code workspace, so this file records the operational constitution needed to make the system live inside the HireWire repo.

## Commandment

AI must operate inside a governed system:

- right tool
- right context
- right protected-file rules
- right verification
- right handoff

## Live Files

- `CLAUDE.md`
- `MEMORY.md`
- `.claude/settings.json`
- `.claude/context/*.md`
- `.claude/commands/*.md`
- `memory/project_claude_ai_os_constitution.md`

## Tool Boundaries

| Tool | Use For | Do Not Use For |
| --- | --- | --- |
| ChatGPT / Noor | Product decisions, sequencing, prompts | Blind repo edits |
| Codex / VS Code | Implementation, local verification | Product invention |
| Claude | Review, critique, audit, guardrails | Unscoped rewrites |
| v0 | UI drafting from verified state | Backend assumptions |
| Supabase | Schema/RLS/data validation | UI decisions |

## HireWire Enforcement

The HireWire-specific source of truth remains `CLAUDE.md`.

The most important invariants:

- `lib/readiness/evaluator.ts` is the readiness authority.
- `lib/actions/apply.ts` is the apply mutation authority.
- `/ready-to-apply` is the apply gate.
- `jobs.generated_resume` and `jobs.generated_cover_letter` are canonical generated document fields.
- Generated claims must be grounded in `evidence_library`.
- Supabase reads/writes must be authenticated and user-scoped.
- Migrations must be idempotent and append-only.

## Active Slash Commands

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

## Operating Loop

```txt
Noor decides
-> Codex builds
-> Claude reviews
-> v0 designs only when backend reality is known
-> Supabase checks schema/RLS when data contracts change
```

## Completion Standard

Every completed build should include:

- changed files
- what changed
- verification commands
- known risks
- rollback notes

Every completed audit should include:

- exact file references
- working vs visual-only verdict
- P0/P1/P2/P3 fix plan
- next prompt for the right tool
