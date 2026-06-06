# /constitution — Load Project Constitution

Surfaces the current project's BUILD_CONSTITUTION.md in a scannable format.

---

Read `BUILD_CONSTITUTION.md` from the repo root and output:

## CONSTITUTION SUMMARY — [PROJECT NAME]

**Core principle:** [the single most important rule]

**Dead systems (do not touch):**
[list from Section 2]

**Forbidden patterns:**
[list from Section 20 / Never Do These]

**High-risk files (ask before touching):**
[list from Section 18]

**Pre-commit checklist:**
[list from Section 19]

**Canonical data sources:**
[table from Section 10]

**Active phase + current tasks:**
[from Section 5]

---

If BUILD_CONSTITUTION.md does not exist:

```
CONSTITUTION MISSING

This repo has no BUILD_CONSTITUTION.md.

Before any build work: copy the template from BuildTeam/BUILD_CONSTITUTION_TEMPLATE.md,
fill in all {{PLACEHOLDERS}}, and save as BUILD_CONSTITUTION.md in the repo root.

Without this file, the build team is operating blind.
```
