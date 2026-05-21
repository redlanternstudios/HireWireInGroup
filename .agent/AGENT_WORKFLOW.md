# Agent Workflow — HireWire Coordination Protocol

## Roles

| Role | Agent | Responsibility |
|---|---|---|
| Architect & Approver | Noor / Ro | Defines acceptance criteria, approves final result, sets scope |
| Builder | Codex | Reads task file, writes code, runs tests, leaves completion summary |
| Reviewer | Claude | Reviews diff against acceptance criteria, writes findings, does not rewrite |

---

## Operating Loop

```
1. Noor defines task
   └── Writes or updates .agent/CODEX_TASK.md
   └── Updates .agent/ACCEPTANCE_CRITERIA.md if criteria changed
   └── Updates .agent/BUILD_CONTEXT.md if context changed

2. Codex builds
   └── Reads .agent/BUILD_CONTEXT.md
   └── Reads .agent/CODEX_TASK.md
   └── Reads .agent/ACCEPTANCE_CRITERIA.md
   └── Implements only what is in CODEX_TASK.md
   └── Runs: npx tsc --noEmit, npm run lint, npm run build
   └── Prepends completion summary to CODEX_TASK.md
   └── Does NOT commit

3. Claude reviews
   └── Reads git diff (all changed files)
   └── Reads .agent/ACCEPTANCE_CRITERIA.md
   └── Fills in .agent/CLAUDE_REVIEW.md
   └── Sets verdict: APPROVED / CHANGES REQUIRED / BLOCKED
   └── Does NOT rewrite Codex's work

4. If CHANGES REQUIRED:
   └── Codex reads CLAUDE_REVIEW.md "Required Fixes" section only
   └── Fixes only the listed items
   └── Updates completion summary in CODEX_TASK.md
   └── Claude re-reviews (repeat from step 3)

5. If APPROVED:
   └── Ro reviews CLAUDE_REVIEW.md and the diff
   └── Ro commits and merges, or requests final adjustments
   └── Sprint is closed
```

---

## Strict Rules

### Scope Rules
- **One builder at a time.** Codex does not begin a new task while Claude is reviewing. Claude does not begin reviewing while Codex is building.
- **Codex does not expand scope** beyond what is written in CODEX_TASK.md. If a related issue is discovered, it is noted in the completion summary and left for Noor to decide.
- **Claude does not rewrite Codex's work** unless explicitly instructed by Noor/Ro. Claude's role is to review and report, not to fix.
- **No new features during stabilization.** Any PR that adds new product functionality is out of scope and should be rejected at review.

### Schema Rules
- **All schema changes must be idempotent.** Every migration statement uses `IF NOT EXISTS` or `IF EXISTS`. Running the migration twice must not error.
- **No direct schema mutations in app code.** Schema changes belong in the migrations folder only.
- **Column types must match what the route writes.** If the route writes a `boolean`, the column must be `boolean`, not `text`.

### AI Output Rules
- **All AI output must remain schema-validated.** The `Output.object({ schema })` call stays on every `generateText` invocation that produces structured data. Fallback parsing does not replace schema validation — it runs after parsing.
- **No fabricated completions.** If AI generation fails, the route must return an error. It must not substitute empty data or default values for AI-generated content.

### Error and Logging Rules
- **No silent failures.** Every Supabase write error that affects generation outcome must be logged. Silent swallows (`.then(() => {}, () => {})`) are permitted only for non-critical additive writes (counters, governance audit rows).
- **No fake completion.** Codex must not mark a task complete unless the acceptance criteria have been tested. If a test cannot run, the reason must be documented in the completion summary.
- **If a test cannot run, document why.** "I assume it passes" is not acceptable. Document the blocker.

### Review Rules
- **Claude fills in CLAUDE_REVIEW.md completely.** No placeholder fields left blank.
- **CHANGES REQUIRED items must be exact.** Codex must be able to implement each required fix without asking a follow-up question.
- **APPROVED does not mean perfect.** It means all acceptance criteria in ACCEPTANCE_CRITERIA.md are met. Remaining risks are documented in the review.

---

## File Ownership

| File | Owner | Who can edit |
|---|---|---|
| `.agent/BUILD_CONTEXT.md` | Noor/Ro | Noor/Ro only |
| `.agent/CODEX_TASK.md` | Noor/Ro + Codex | Noor/Ro sets task; Codex prepends completion summary |
| `.agent/CLAUDE_REVIEW.md` | Claude | Claude fills in after each Codex build |
| `.agent/ACCEPTANCE_CRITERIA.md` | Noor/Ro | Noor/Ro only |
| `.agent/AGENT_WORKFLOW.md` | Noor/Ro | Noor/Ro only |

---

## Communication Protocol

**Noor → Codex:** Edit CODEX_TASK.md. Codex reads it before starting.

**Codex → Claude:** Prepend completion summary to CODEX_TASK.md. Claude reads it before reviewing.

**Claude → Codex:** Write findings to CLAUDE_REVIEW.md. Codex reads "Required Fixes" section only.

**Claude → Noor/Ro:** Write "Notes to Ro" section in CLAUDE_REVIEW.md.

**No out-of-band communication.** All task state lives in the `.agent/` files. If it is not written down here, it does not exist.

---

## Sprint Closure Checklist

Before Ro approves:

- [ ] CODEX_TASK.md has a prepended completion summary
- [ ] CLAUDE_REVIEW.md verdict is APPROVED
- [ ] All 9 acceptance criteria in ACCEPTANCE_CRITERIA.md are marked PASS in CLAUDE_REVIEW.md
- [ ] `npx tsc --noEmit` passes (or pre-existing failures documented)
- [ ] `npm run build` passes (or pre-existing failures documented)
- [ ] Migration is idempotent (tested by running twice)
- [ ] No new features were added
- [ ] No silent failures remain in the generation route
