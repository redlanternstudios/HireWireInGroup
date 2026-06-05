# /debug — Contained Bug Hunt

One error. One file. No wandering.

Rory will provide: the error message or unexpected behavior.

Step 1 — Reproduce: state exactly what triggers the error
Step 2 — Isolate: identify the single file and function at root cause
Step 3 — Diagnose: state root cause in one sentence (VERIFIED / LIKELY / ASSUMED)
Step 4 — Fix: write the minimal fix. No refactoring.
Step 5 — Verify: exact command to confirm the fix worked.

## OUTPUT FORMAT

```
ERROR: [what's broken]
ROOT CAUSE: [one sentence — VERIFIED/LIKELY/ASSUMED]
FILE: [path:line]
FIX: [the code change]
VERIFY: [command]
DONE WHEN: [exact observable behavior]
```

If the bug spans more than one file → stop. Use /scope to plan a multi-file fix.
If the fix requires a schema change → stop. Escalate to Rory.
