## CLAUDE.md & Schema Alignment Checklist

- [ ] CLAUDE.md cross-checked for all new/changed features
- [ ] Live Supabase schema cross-checked (run `scripts/schema-drift-check.sh`)
- [ ] No forbidden patterns (run `scripts/precommit-claude-md-schema-check.sh`)
- [ ] All new/changed routes/pages/components exist and are wired
- [ ] All queries use tenant isolation and soft delete where required
- [ ] All API routes use requireUser or equivalent auth guard
- [ ] No legacy/dead table references
- [ ] All migrations are in /scripts/ and reviewed

---

**Describe what this PR does and why:**
