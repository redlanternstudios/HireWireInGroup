## CLAUDE.md & Schema Alignment Checklist

- [ ] CLAUDE.md cross-checked for all new/changed features
- [ ] Live Supabase schema cross-checked (run `scripts/schema-drift-check.sh`)
- [ ] No forbidden patterns (run `scripts/precommit-claude-md-schema-check.sh`)
- [ ] All new/changed routes/pages/components exist and are wired
- [ ] All queries use tenant isolation and soft delete where required
- [ ] All API routes use requireUser or equivalent auth guard
- [ ] No legacy/dead table references
- [ ] All migrations are in /scripts/ and reviewed
- [ ] Prove Fit/readiness changes use `lib/evidence/unresolved-requirements.ts` and do not duplicate unresolved-requirement logic
- [ ] v0-facing UI changes consume documented API contracts instead of inventing local readiness or Supabase behavior

---

**Describe what this PR does and why:**

## Supabase / Data Contract Impact

- [ ] No schema changes
- [ ] Migration added and reviewed
- [ ] New/changed reads are scoped by authenticated `user_id`
- [ ] New/changed job reads preserve `deleted_at is null`
- [ ] JSONB fields are guarded before map/length access

Notes:

## v0 / UI Contract Impact

- [ ] No v0/UI impact
- [ ] v0 prompt or handoff updated
- [ ] UI consumes an existing API/server contract
- [ ] No fake success, readiness, generation, apply, or outcome states

Notes:
