# v0 Sync Workflow

Use this when Copilot, Claude Code, Codex, or manual VS Code edits change HireWire and v0 needs the freshest product truth.

## Source Of Truth

The live v0 handoff is generated at:

```txt
.agent/V0_LIVE_HANDOFF.md
```

Paste that file into v0 before asking for UI changes. It includes:

- current branch and HEAD
- unresolved merge conflicts
- changed files
- changed pages, API routes, components, migrations, tests, and docs
- protected/high-risk files in the diff
- backend assumptions v0 must not make
- a ready-to-paste v0 prompt

## One-Time Refresh

```bash
npm run agent:v0-sync
```

## Auto-Refresh While Building

In VS Code, run the task:

```txt
HireWire: v0 live handoff watch
```

Or run:

```bash
npm run agent:v0-sync:watch
```

The watcher polls git state and rewrites `.agent/V0_LIVE_HANDOFF.md` whenever the working tree changes. That means edits from Copilot, Claude Code, Codex, or a human all flow into the same handoff.

## Guardrail

If the handoff lists unresolved conflicts, use v0 for design recommendations only. Do not ask v0 for final code until conflicts are resolved.

## Build-Day Rule

Before a v0 prompt:

1. Run `npm run agent:v0-sync`.
2. Open `.agent/V0_LIVE_HANDOFF.md`.
3. Paste it into v0.
4. Ask v0 to change only the affected screen/component.
5. Bring v0 output back into VS Code and run the normal verification chain.
