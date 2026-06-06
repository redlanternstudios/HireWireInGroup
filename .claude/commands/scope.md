# /scope — Task Scope Lock
# Run after PM Brief is approved. Locks what will and won't be touched.

Read the PM Brief and task description, then output exactly this:

## SCOPE LOCK

**Task:** [one sentence]
**Mode:** [quick / playbook / sprint / incident / security]
**Risk Level:** [L0 / L1 / L2 / L3 / L4]

**Files I will touch:**
- `path/to/file.ts` — [why]

**Files I will NOT touch (even if adjacent or tempting):**
- [explicit list]

**Constraints from BUILD_CONSTITUTION.md:**
- [relevant rules]

**Done state:** [exact observable behavior — not "should work"]
**Verification command:** `[tsc / lint / build]`
**Escalation rule:** If I need to touch a file not listed → BLOCKED format required.

---

After outputting this, wait for Rory to confirm before writing a single line of code.
If Rory says "go" → execute exactly the locked scope. Nothing more.
