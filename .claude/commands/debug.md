# /debug — Contained Bug Hunt
# One error. One file. No wandering.

Step 1 — Reproduce: what triggers the error
Step 2 — Isolate: single file and function at root cause
Step 3 — Diagnose: root cause in one sentence (VERIFIED / LIKELY / ASSUMED)
Step 4 — Fix: minimal fix. No refactoring.
Step 5 — Verify: exact command to confirm fix worked.

## OUTPUT FORMAT

```
ERROR:      [what's broken]
ROOT CAUSE: [one sentence — VERIFIED/LIKELY/ASSUMED]
FILE:       [path:line]
FIX:        [the code change]
VERIFY:     [command]
DONE WHEN:  [exact observable behavior]
ROLLBACK:   [how to undo if wrong — for L2+ bugs]
```

If bug spans more than one file → stop. Use /scope to plan multi-file fix.
If fix requires schema change → stop. Escalate to Rory.
