# /closeout — Session Close Protocol

Run at the end of every session. No exceptions.

Generate this output:

```
SESSION CLOSEOUT — [DATE] [PROJECT] [MODULE]

## WHAT CHANGED
- [file] — [what changed and why]

## DECISIONS MADE
- [decision] — [why, and who decided]

## VERIFIED STATE
- Build: [GREEN / FAILING — error]
- TypeScript: [CLEAN / X errors]

## BLOCKERS FOUND (not fixed this session)
- [blocker] — [what unblocks it]

## ASSUMPTIONS MADE (need verification)
- [assumption] — [how to verify]

## NEW RULES ESTABLISHED (add to Lesson Ledger)
- [rule] — [what caused it]

## NEXT ACTION
[Single next move. File path + what to do. No ambiguity.]

## COMMIT MESSAGE
[conventional commit message for this session's changes]
```

If NEW RULES are listed: write them to memory/lesson_ledger.md before closing.
Context window is not storage.
