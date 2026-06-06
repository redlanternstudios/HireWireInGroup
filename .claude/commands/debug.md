# /debug — Contained Bug Hunt

One error. One file. No wandering.

---

Rory will provide: the error message or unexpected behavior.

## PROTOCOL

**Step 1 — Reproduce**
State exactly what triggers the error. If you can't reproduce it from what's provided, ask for: the exact error + stack trace + which action caused it.

**Step 2 — Isolate**
Identify the single file and function where the error originates. Do not chase the entire call chain — stop at the root cause file.

**Step 3 — Diagnose**
State the root cause in one sentence. Label it:
- `VERIFIED` — I can see the bug in the code
- `LIKELY` — evidence points here, not 100% confirmed
- `ASSUMED` — hypothesis, needs testing

**Step 4 — Fix**
Write the minimal fix. Do not refactor. Do not improve adjacent code.

**Step 5 — Verify**
Provide the exact command to confirm the fix worked.

---

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
