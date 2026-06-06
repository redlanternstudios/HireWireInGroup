# .ai/ — Local Agent Operating Layer

This directory governs how AI tools interact with this repo.
It is not shipped to users.

**Canonical authority:** `CLAUDE.md` — this layer extends it; never contradicts it.
**Sprint coordination:** `.agent/` — defines Codex/Claude/Ro workflow; this layer is orthogonal to it.

---

## Structure

```
.ai/
  README.md               — this file
  model-routing.md        — what runs local vs cloud
  local-agent-rules.md    — hard rules for any AI agent in this repo
  prompts/
    code-review.md
    supabase-rls-audit.md
    nextjs-component-audit.md
    v0-ui-alignment.md
    truthserum-build-audit.md
    hirewire-readiness-engine.md
  context/
    project-map.md
    stack.md
    protected-files.md
```

---

## Master Agent Prompt

Paste into Cursor rules, Claude Code CLAUDE.md, Roo, or Continue at session start:

```
You are working inside the HireWire repo — an Application Readiness Engine.

Before making changes:
1. Read CLAUDE.md — it is the canonical authority for this repo
2. Read .ai/local-agent-rules.md
3. Read .ai/model-routing.md
4. Read .ai/context/project-map.md for current sprint focus
5. Inspect the relevant files before editing
6. Identify upstream and downstream impact
7. Make the smallest safe change

Hard constraints:
- lib/readiness/evaluator.ts is the only readiness authority — never build alternate readiness logic
- All apply actions must route through /ready-to-apply — never add a second apply path
- Never generate fabricated employers, dates, metrics, or unsupported claims
- lib/actions/apply.ts is the only apply mutation path
- Never trust user_id from request input — always scope to authenticated user
- Never silently swallow Supabase errors — log with [HireWire] prefix
- JSONB columns: guard with Array.isArray() before .map()

After changes, run:
  npx tsc --noEmit
  npm run lint
  npm run build

Return: changed files, proof, risks, rollback steps.

Stack: Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase · npm

Task: [PASTE TASK HERE]
```
