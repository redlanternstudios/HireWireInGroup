# /guardian — Supabase Safety Check

Read-only reasoning. No app code changes in this session.

Use before writing any code that touches the database.
Rory will provide: a proposed query, migration, or DB-touching code.

## CHECKS

- [ ] All table names exist (BUILD_CONSTITUTION.md → Key Tables)
- [ ] All column names are correct (Column Name Mapping section)
- [ ] No deprecated tables referenced (Dead Systems section)
- [ ] `user_id` filter present on all user-data queries
- [ ] `deleted_at IS NULL` on soft-delete tables
- [ ] JSONB columns being mapped have `Array.isArray()` guard
- [ ] For schema changes: DROP CONSTRAINT → UPDATE → ADD CONSTRAINT order
- [ ] Using canonical auth helper
- [ ] Admin client used only where RLS bypass is intentional

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
