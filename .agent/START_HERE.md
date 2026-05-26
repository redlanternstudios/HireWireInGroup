# Agent Start Here

This is the compact entry point for HireWire agent work.

## Canonical Authority

Read `CLAUDE.md` first when policy is unclear. It wins over older docs.

## Current Task

Structured task metadata lives in `.agent/task.json`.

Human-readable task details live in `.agent/CODEX_TASK.md`.

Acceptance criteria live in `.agent/ACCEPTANCE_CRITERIA.md`.

## Current Policy

Autonomy and protected-file rules live in `.agent/policy.json`.

Before editing, run:

```bash
npm run agent:preflight
```

Before handing work to review, run:

```bash
npm run agent:verify
```

## Product Loop

HireWire must converge on:

```txt
job -> ready -> applied -> outcome
```

Every change should support the Application Readiness Engine loop:

```txt
sign up/sign in
-> dashboard
-> add/capture job
-> analyze job
-> prove fit with Career Context
-> clarify weak evidence
-> generate grounded Application Package
-> preview provenance
-> pass Ready to Apply gate
-> apply or log override
-> learn from outcome
```

## Fast Commands

```bash
npm run agent:protected
npm run agent:preflight
npm run agent:verify
npm run agent:dead-ui
npm run agent:handoff -- --target=codex
npm run agent:handoff -- --target=claude-review
npm run agent:new-task -- --id=my-task --title="My Task" --goal="What this changes"
```
