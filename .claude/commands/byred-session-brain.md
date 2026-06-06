# byred-session-brain

**Purpose:** Log every By Red AI work session to Supabase and update LESSON_LEDGER.md. The compounding engine — every session leaves a trace, every mistake becomes permanent.

**Triggers:** "wrap it up" · "log this session" · "capture session" · "session done" · "close out"

---

## Static IDs (never look up, always use these)

- **Supabase project:** `mlmrdkiyxlngmwhdtrln` (By Red, LLC.)
- **Sessions table:** `byred_ai_sessions`
- **Lesson table:** `byred_lesson_ledger`
- **Lesson Ledger file:** `/workspaces/HireWireInGroup/LESSON_LEDGER.md`

---

## Execution Steps

### STEP 1 — Survey the session

Review the current conversation and extract:

**Decisions made** — What did Ro decide? (strategy calls, product choices, scope calls, approvals)
**Artifacts built** — What was created? (files written, tables created, skills shipped, migrations applied)
**Blockers hit** — What stopped progress or required a workaround?
**Mistakes caught** — What was wrong and corrected? What did Claude get wrong?
**Open question** — The single most important unresolved question (one sentence, or null)

**Determine session mode:**
- `strategy` — majority of session was planning, designing, deciding
- `build` — majority was writing code, files, or DB schema
- `ops` — majority was managing tasks, team, pipeline, admin
- `mixed` — roughly equal blend

**Estimate duration:** Count message exchanges. ~10 exchanges ≈ 15 min. ~25 ≈ 35 min. ~50+ ≈ 60+ min.

---

### STEP 2 — Draft the session record

Format internally:

```
DATE: [today]
MODE: [strategy|build|ops|mixed]
DURATION: ~[N] min

SUMMARY: [2-3 sentence plain-English description of what happened]

DECISIONS:
- [decision 1]
- [decision 2]
...

ARTIFACTS:
- [artifact 1 — file path or table name]
- [artifact 2]
...

BLOCKERS:
- [blocker 1, if any]
...

LESSONS:
- DOMAIN: [domain] | RULE: [one prescriptive sentence] | ORIGIN: [what triggered this]
(only include if something was genuinely corrected or learned — do not manufacture lessons)

OPEN QUESTION: [one sentence or null]
```

---

### STEP 3 — Write to Supabase

Use `mcp__claude_ai_Supabase__execute_sql` with project `mlmrdkiyxlngmwhdtrln`:

```sql
INSERT INTO public.byred_ai_sessions (
  session_date, mode, duration_min, summary,
  decisions, artifacts, blockers, lessons, open_question, meta
) VALUES (
  CURRENT_DATE,
  '[mode]',
  [duration_min],
  '[summary]',
  '[decisions_json]'::jsonb,
  '[artifacts_json]'::jsonb,
  '[blockers_json]'::jsonb,
  '[lessons_json]'::jsonb,
  '[open_question or null]',
  '{"skill_version": "1.0", "trigger": "byred-session-brain"}'::jsonb
) RETURNING id, lesson_ids;
```

Capture the returned `id` as `SESSION_ID`.

---

### STEP 4 — Write lessons to Supabase + LESSON_LEDGER.md

**Only if LESSONS list is non-empty:**

For each lesson:

1. Insert into `byred_lesson_ledger`:
```sql
INSERT INTO public.byred_lesson_ledger (domain, rule, origin, session_id)
VALUES ('[domain]', '[rule]', '[origin]', '[SESSION_ID]')
RETURNING lesson_id;
```
Capture the `lesson_id` (e.g., `LL-005`).

2. Append to `/workspaces/HireWireInGroup/LESSON_LEDGER.md` inside the `<!-- LESSONS START --> ... <!-- LESSONS END -->` block:
```markdown
### [lesson_id] — [today's date] — [domain]
**Rule:** [rule]
**Origin:** [origin]
```

3. Update the `*Next LL number:*` line at the bottom of `LESSON_LEDGER.md`.

4. Update the `byred_ai_sessions` row with the collected lesson IDs:
```sql
UPDATE public.byred_ai_sessions
SET lesson_ids = ARRAY['[LL-XXX]', ...]
WHERE id = '[SESSION_ID]';
```

---

### STEP 5 — Confirm to Ro

Output exactly this format:

```
✅ Session logged — [DATE] — [MODE] — ~[DURATION] min

📋 Summary: [1-sentence summary]

🏗️ Artifacts: [count] built
🧭 Decisions: [count] logged
⚠️ Blockers: [count]
📚 Lessons: [count] added to Lesson Ledger ([LL-XXX, ...] or "none")
❓ Open question: [question or "none"]

Session ID: [SESSION_ID]
```

---

## Rules

- Do not manufacture lessons. Only log genuine corrections or new operating rules.
- Do not send any outbound communication during this skill.
- If Supabase write fails, log the error with `[ByRedOS]` prefix and deliver the session record as plain text so Ro can save it manually.
- If no artifacts/decisions/blockers exist, write empty arrays — do not skip the write.
- This skill is idempotent — running it twice in the same session creates a second record. Inform Ro if re-running.
