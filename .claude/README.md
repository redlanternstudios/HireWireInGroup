# Claude Code Layer

This directory contains HireWire-specific Claude Code settings, context, and reusable project commands.

Canonical authority order:

1. `CLAUDE.md`
2. `.claude/context/*.md`
3. `.ai/*.md`
4. `.agent/*.md`
5. older docs and audits

Use this layer to keep Claude focused on the real HireWire system:

- Application Readiness Engine
- Prove Fit / Match Interview
- evidence-grounded generation
- readiness-gated apply flow
- Supabase-authenticated, tenant-scoped data access

Do not treat command prompts as permission to expand scope. The user's current instruction wins.

Daily/helper commands:

- `/project:build-day-prompt`
- `/project:health-check`
- `/project:convergence-check`
- `/project:keymon-setup`
