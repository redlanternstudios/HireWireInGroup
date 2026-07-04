# /closeout — Session Close Protocol

Run this at the end of every session. No exceptions.

---

## GENERATE THIS OUTPUT
# Run at the end of every session. No exceptions.

Generate this output:

```
SESSION CLOSEOUT — [DATE] [PROJECT] [MODULE]

## WHAT CHANGED
- [file] — [what changed and why]
- [file] — [what changed and why]

## DECISIONS MADE
- [decision] — [why, and who decided]

## VERIFIED STATE
- Build: [GREEN / FAILING — error]
- TypeScript: [CLEAN / X errors]
- Tests: [N/A / PASSING / FAILING]

## BLOCKERS FOUND (not fixed this session)
- [blocker] — [why it wasn't fixed, what unblocks it]

## BLOCKERS FOUND (not fixed this session)
- [blocker] — [what unblocks it]

## ASSUMPTIONS MADE (need verification)
- [assumption] — [how to verify]

## NEW RULES ESTABLISHED (add to Lesson Ledger)
## REVIEW VERDICT
- [PASS / FLAG / REJECT — and any open flags]

## NEW RULES ESTABLISHED
- [rule] — [what caused it]

## NEXT ACTION
[Single next move. File path + what to do. No ambiguity.]

## COMMIT MESSAGE
[conventional commit message for this session's changes]
```

---

After generating: if any NEW RULES are listed, write them to `memory/lesson_ledger.md`
before closing. Context window is not storage.
[conventional commit message]
```

If NEW RULES are listed: write them to lesson_ledger.md before closing.
If REVIEW had FLAGS: memory status = Flagged or Partial. Not Active.
Context window is not storage.
