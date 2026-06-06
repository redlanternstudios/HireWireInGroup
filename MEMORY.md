# HireWire Memory Index

Load this index at the start of every AI-assisted HireWire session.

## Always Load

- `CLAUDE.md` — repo constitution and non-negotiable engineering rules
- `.claude/context/product.md` — HireWire product model and language
- `.claude/context/architecture.md` — stack, directories, and architecture risks
- `.claude/context/protected-files.md` — high-risk files and change restrictions
- `memory/project_claude_ai_os_constitution.md` — operating system for Claude, Codex, v0, ChatGPT/Noor, and review loops

## Load When Relevant

- `.claude/context/routes.md` — route and sidebar decisions
- `.claude/context/data-contracts.md` — DB/source-of-truth rules
- `.claude/context/verification.md` — audit and verification requirements
- `.agent/BUILD_CONTEXT.md` — current build-day context
- `.agent/CODEX_TASK.md` — scoped implementation task
- `.agent/ACCEPTANCE_CRITERIA.md` — pass/fail criteria
- `.agent/CLAUDE_REVIEW.md` — latest review verdict

## Command Layer

Project slash commands live in `.claude/commands/`.

Use audit commands before refactors. Use `build-day` only when the user explicitly wants implementation.

Helpful daily commands:

- `/project:build-day-prompt` — start/end Build Day bookends
- `/project:health-check` — no-edit repo health scan
- `/project:convergence-check` — no-edit product journey convergence check
- `/project:keymon-setup` — setup prompt for Keymon's Claude / VS Code environment
