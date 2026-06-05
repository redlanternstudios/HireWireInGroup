# /review — Pre-Merge Code Review

Run before accepting any Codex output or merging any PR.

Rory will provide: a diff, file contents, or PR description.
Review against BUILD_CONSTITUTION.md + these universal checks:

## UNIVERSAL CHECKS

- [ ] Every user-data query includes `user_id` filter
- [ ] Soft-delete tables include `deleted_at IS NULL`
- [ ] No `.map()` on JSONB without `Array.isArray()` guard
- [ ] No `data.field || []` on JSONB fields
- [ ] Uses project's canonical auth helper
- [ ] No service role key in client-reachable code
- [ ] Uses project's canonical model constants (not raw strings)
- [ ] Only touches files in the stated scope
- [ ] No new packages installed
- [ ] No protected files touched (auth, billing, middleware)
- [ ] TypeScript compiles clean
- [ ] Error states handled (not swallowed)
- [ ] Done state is verifiable

## OUTPUT FORMAT

```
VERDICT: PASS | FLAG | REJECT

PASS: [what's solid]

FLAGS (must fix before merge):
- [issue] in [file:line]

RISKS (review but not blocking):
- [concern]

VERDICT RATIONALE: [one sentence]
```
