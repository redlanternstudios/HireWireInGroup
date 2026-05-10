# Contributing to HireWire

## Alignment First
- **CLAUDE.md is the canonical spec.** All code, migrations, and features must align with it.
- **Live schema is the source of truth.** All migrations must be tracked in `/scripts/` and match Supabase.

## Required Before Every Commit/PR
- Run `scripts/precommit-claude-md-schema-check.sh` and fix any issues.
- Run `scripts/schema-drift-check.sh` to ensure no schema drift.
- Complete the PR checklist in `.github/PULL_REQUEST_TEMPLATE.md`.
- Reference `docs/alignment-audit.md` for the full audit protocol.

## Common Pitfalls
- Never use forbidden patterns (see CLAUDE.md and precommit script).
- Never reference dead/legacy tables or columns.
- Always use tenant isolation and soft delete filters in queries.
- All API routes must use `requireUser` or equivalent auth guard.

## Review Process
- All PRs are reviewed for CLAUDE.md and schema alignment.
- Major merges require a v0 audit (see audit protocol).

## Getting Help
- Read CLAUDE.md and `docs/alignment-audit.md` first.
- Ask in the team channel if unsure about spec or schema.
