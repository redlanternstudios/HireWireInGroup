# /review — Pre-Merge Code Review

Run before accepting any Codex output or merging any PR.

---

Rory will provide: a diff, file contents, or PR description.

Review against BUILD_CONSTITUTION.md + these universal checks:

## UNIVERSAL CHECKS

**Tenant safety:**
- [ ] Every user-data query includes `user_id` filter
- [ ] Soft-delete tables include `deleted_at IS NULL`

**Data safety:**
- [ ] No `.map()` on JSONB without `Array.isArray()` guard
- [ ] No `data.field || []` on JSONB fields (use `Array.isArray`)

**Auth pattern:**
- [ ] Uses project's canonical auth helper (not inline custom check)
- [ ] No service role key in client-reachable code

**AI / external calls:**
- [ ] Uses project's canonical model constants (not raw strings)
- [ ] No dead/removed providers referenced

**Scope:**
- [ ] Only touches files in the stated scope
- [ ] No new packages installed
- [ ] No protected files touched (auth, billing, middleware)

**Completeness:**
- [ ] TypeScript compiles clean
- [ ] No console.log left in
- [ ] Error states handled (not swallowed)
- [ ] Done state is verifiable, not assumed
# /review — Pre-Merge Quality Arbitration
# Run before accepting any Codex output or merging any PR.
# Verdict: PASS | FLAG | REJECT

Rory will provide: a diff, file contents, or PR description.
Review against BUILD_CONSTITUTION.md + these universal checks:

## CHECKS

**Scope:**
- [ ] Only touches files in the stated scope
- [ ] No new packages installed
- [ ] No protected files touched (auth, billing, middleware)

**Tenant + data safety:**
- [ ] Every user-data query includes `user_id` filter
- [ ] Soft-delete tables include `deleted_at IS NULL`
- [ ] No `.map()` on JSONB without `Array.isArray()` guard

**Auth:**
- [ ] Uses project's canonical auth helper
- [ ] No service role key in client-reachable code

**Completeness:**
- [ ] TypeScript compiles clean
- [ ] No console.log left in production code
- [ ] Error states handled (not swallowed)
- [ ] Done state is verifiable, not assumed
- [ ] Acceptance criteria from PM Brief are met

## OUTPUT FORMAT

```
VERDICT: PASS | FLAG | REJECT

PASS: [what's solid]
ACCEPTANCE CRITERIA: [met / partial / failed — per criterion]
SCOPE ALIGNMENT: [clean / deviations found]
SAFETY CHECK: [clean / flagged]

FLAGS (must fix before merge):
- [issue] in [file:line]

RISKS (review but not blocking):
- [concern]

VERDICT RATIONALE: [one sentence]
```

REJECT = do not merge under any condition.
FLAG = fix listed items first, then re-review.
PASS = safe to merge.
RISKS (not blocking):
- [concern]

SHIP RECOMMENDATION: [yes / internal only / no]
VERDICT RATIONALE: [one sentence]
```

REJECT = do not merge. FLAG = fix then re-review. PASS = safe to merge.
