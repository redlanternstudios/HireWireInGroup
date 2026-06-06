# /scope — Task Scope Lock

Run this before any implementation. Locks what will and won't be touched.

---

Read the task description Rory provided, then output exactly this:

## SCOPE LOCK

**Task:** [one sentence — what we're building]

**Files I will touch:**
- `path/to/file1.ts` — [why]
- `path/to/file2.tsx` — [why]

**Files I will NOT touch (even if relevant):**
- [any adjacent file that could be tempting but is out of scope]

**Constraints from BUILD_CONSTITUTION.md:**
- [relevant rules that apply to this task]

**Done state:** [exact observable behavior that confirms completion — not "should work"]

**Verification command:** `[tsc / lint / build command]`

---

After outputting this, wait for Rory to confirm before writing a single line of code.

If Rory says "go" — execute exactly the locked scope. Nothing more.
