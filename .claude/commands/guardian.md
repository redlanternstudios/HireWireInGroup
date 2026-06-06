# /guardian — Supabase Safety Check

Read-only reasoning. No app code changes in this session.

---

Use this before writing any code that touches the database.

## WHAT TO PROVIDE

Rory will give: a proposed query, migration, or DB-touching code.

## CHECKS

**Schema validity:**
- [ ] All table names exist (check BUILD_CONSTITUTION.md → Key Tables)
- [ ] All column names are correct (check Column Name Mapping)
- [ ] No deprecated tables referenced (check Dead Systems)

**Tenant isolation:**
- [ ] `user_id` filter present on all user-data queries
- [ ] `deleted_at IS NULL` on soft-delete tables

**RLS:**
- [ ] Does this query require RLS to be enabled?
- [ ] Is there explicit `.eq("user_id", user.id)` even with RLS as backup?

**JSONB safety:**
- [ ] Any JSONB columns being mapped have `Array.isArray()` guard?

**Migration safety (if schema change):**
- [ ] DROP CONSTRAINT before UPDATE before ADD CONSTRAINT (for CHECK constraints)
- [ ] Is this backward compatible with existing data?
- [ ] Does this require a data backfill?

**Auth pattern:**
- [ ] Using canonical auth helper from the project?
- [ ] Admin client (`createAdminClient`) used only where RLS bypass is intentional?

## OUTPUT FORMAT

```
VERDICT: SAFE | RISK | BLOCKED

SAFE: [what's validated]

RISKS:
- [risk] — [severity: LOW/MED/HIGH]

BLOCKED (fix before writing any code):
- [blocker]

RECOMMENDATION: [proceed / change X first / escalate]
```

This session ends after the safety check. Open a new session to implement.
