# byred-lesson-ledger

**Purpose:** Add a new entry to the Lesson Ledger — the permanent, append-only operating rulebook for By Red LLC. Claude reads this before any strategic brief via `byred-pre-flight`.

**Triggers:** "add a lesson" · "log that mistake" · "update the ledger" · "that was wrong — log it" · "new rule" · "add to the ledger"

---

## Static IDs

- **Supabase project:** `mlmrdkiyxlngmwhdtrln` (By Red, LLC.)
- **Lesson table:** `byred_lesson_ledger`
- **Lesson Ledger file:** `/workspaces/HireWireInGroup/LESSON_LEDGER.md`

---

## Domains

`outreach` · `product` · `operations` · `supabase` · `skills` · `team` · `finance` · `brand` · `general`

---

## Execution Steps

### STEP 1 — Extract the lesson

From Ro's trigger message, identify:

- **Domain:** Which of the 9 domains does this belong to? If unclear, ask Ro to choose.
- **Rule:** One prescriptive sentence in active voice. Must be actionable. Examples:
  - ✅ "Always confirm the prospect's budget before building a proposal."
  - ✅ "Never apply a Supabase migration without running `list_tables` first."
  - ❌ "Claude should try to remember to check things." (too vague)
- **Origin:** What happened? One sentence describing the session, mistake, or decision that generated this.

If Rule is ambiguous, draft it and ask Ro to confirm before writing.

---

### STEP 2 — Insert to Supabase

Use `mcp__claude_ai_Supabase__execute_sql` with project `mlmrdkiyxlngmwhdtrln`:

```sql
INSERT INTO public.byred_lesson_ledger (domain, rule, origin)
VALUES ('[domain]', '[rule]', '[origin]')
RETURNING lesson_id, lesson_number, created_at;
```

Capture `lesson_id` (e.g., `LL-007`).

---

### STEP 3 — Append to LESSON_LEDGER.md

Read `/workspaces/HireWireInGroup/LESSON_LEDGER.md`.

Insert the new entry inside the `<!-- LESSONS START --> ... <!-- LESSONS END -->` block, after the last existing lesson:

```markdown
### [lesson_id] — [today's date] — [domain]
**Rule:** [rule]
**Origin:** [origin]
```

Update the `*Next LL number:*` line at the bottom to `[lesson_number + 1]`.

---

### STEP 4 — Confirm

```
📚 Lesson logged: [lesson_id]
Domain: [domain]
Rule: "[rule]"
```

---

## Rules

- Append-only. Never edit or delete existing lessons.
- Rule must be one sentence. If Ro provides a paragraph, distill it.
- If Supabase write fails, still append to LESSON_LEDGER.md and surface the error with `[ByRedOS]` prefix.
- Do not infer a lesson from context — only log what Ro explicitly triggers.
