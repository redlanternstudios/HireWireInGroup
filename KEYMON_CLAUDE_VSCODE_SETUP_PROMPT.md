# Keymon Claude / VS Code Setup Prompt

Copy/paste this at the start of Keymon's Claude Code or VS Code AI session.

```txt
You are setting up a Claude / VS Code operating layer for this repo.

Your job is to install the AI operating system so it turns itself on for future sessions.

Do not edit application code yet.
Do not refactor.
Do not change schema.
Do not commit.

First:
1. Check `pwd`.
2. Check `git status --short`.
3. Read any existing `CLAUDE.md`, `MEMORY.md`, `.claude/`, `.ai/`, `.agent/`, and README files.
4. Preserve existing repo-specific rules. Do not overwrite valuable instructions.
5. If `CLAUDE.md` exists, restructure it carefully. If it does not exist, create it.

Create or update this structure:

```txt
CLAUDE.md
MEMORY.md
memory/project_claude_ai_os_constitution.md
.claude/README.md
.claude/settings.json
.claude/context/product.md
.claude/context/architecture.md
.claude/context/protected-files.md
.claude/context/routes.md
.claude/context/data-contracts.md
.claude/context/verification.md
.claude/commands/build-day-prompt.md
.claude/commands/health-check.md
.claude/commands/convergence-check.md
.claude/commands/review-diff.md
.claude/commands/truth-audit.md
.claude/commands/v0-handoff.md
.claude/commands/supabase-audit.md
.claude/commands/api-route-audit.md
.claude/commands/component-audit.md
.claude/commands/button-handler-audit.md
.claude/commands/package-audit.md
```

Make `CLAUDE.md` the activation file. It must say future sessions should read:

1. `CLAUDE.md`
2. `MEMORY.md`
3. `memory/project_claude_ai_os_constitution.md`
4. `.claude/context/product.md`
5. `.claude/context/architecture.md`
6. `.claude/context/protected-files.md`

Add these non-negotiable operating rules:

- Read before editing.
- Inspect actual files before claiming behavior.
- Do not invent routes, props, tables, or APIs.
- Do not overwrite user changes.
- Do not change schema unless explicitly asked.
- Migrations must be idempotent.
- Protected files require narrow scope and extra review.
- Audit commands do not edit files.
- Build commands must report changed files, verification, risks, and rollback notes.
- v0 handoffs must distinguish real backend behavior from assumed behavior.

Create `.claude/settings.json` with safe read/build permissions and deny destructive commands:

```json
{
  "permissions": {
    "allow": [
      "Bash(pwd)",
      "Bash(ls:*)",
      "Bash(find:*)",
      "Bash(rg:*)",
      "Bash(sed:*)",
      "Bash(wc:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git show:*)",
      "Bash(npm run lint:*)",
      "Bash(npm run build:*)",
      "Bash(npx tsc --noEmit:*)"
    ],
    "deny": [
      "Bash(git reset:*)",
      "Bash(git checkout:*)",
      "Bash(git clean:*)",
      "Bash(rm -rf:*)",
      "Bash(supabase db reset:*)",
      "Bash(supabase db push:*)"
    ]
  }
}
```

Create the built-in commands:

1. `build-day-prompt`
   - Contains a start-of-day orientation prompt and end-of-day closeout prompt.
   - Requires reading constitution, memory, context, and git status before edits.
   - Ends with a convergence verdict.

2. `health-check`
   - No edits.
   - Checks repo status, dependency scripts, route structure, auth boundaries, API health, test/build commands, TODO/FIXME, console logs, dead buttons, and protected-file drift.
   - Outputs P0/P1/P2/P3 risks.

3. `convergence-check`
   - No edits.
   - Compares current repo behavior to the product's main journey.
   - Finds duplicate systems, visual-only features, missing gates, and broken downstream effects.

4. `review-diff`
   - No edits.
   - Findings first, severity ordered, with file/line references.

5. `truth-audit`
   - No edits.
   - Maps routes, pages, components, buttons, data, APIs, database calls, visual-only features, partial features, duplicates, stale work, and P0 fixes.

6. `v0-handoff`
   - Produces a v0 prompt from verified backend reality.
   - Explicitly says what is wired and what is not wired.

7. `supabase-audit`
   - No edits.
   - Maps tables, operations, auth context, RLS assumptions, broad queries, missing user scope, and schema drift.

8. `api-route-audit`
   - No edits.
   - Maps every API route, auth, validation, tables, callers, outputs, and risks.

9. `component-audit`
   - No edits.
   - Maps components, props, state, handlers, mock/real data, duplicates, and status.

10. `button-handler-audit`
    - No edits.
    - Maps every button, link, submit, router push, modal trigger, server action, and downstream effect.

11. `package-audit`
    - No edits.
    - Audits generation, preview, save, export, review, readiness gate, and apply handoff.

After creating files:

1. Validate `.claude/settings.json` parses as JSON.
2. Count command files and context files.
3. Print the files created/updated.
4. Print `git status --short`.
5. Confirm the operating layer is turned on by proving `CLAUDE.md` points to `MEMORY.md` and the project constitution memory file.

Final response must say:

- whether setup is live
- files created/updated
- commands available
- what Keymon should run first
- anything that could not be completed
```

