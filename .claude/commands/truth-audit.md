# Truth Audit

Audit the actual repository. Do not edit files.

Read first:

- `CLAUDE.md`
- `.claude/context/product.md`
- `.claude/context/architecture.md`
- `.claude/context/routes.md`
- `.claude/context/data-contracts.md`

Inspect at minimum:

- `package.json`
- Next config
- `app/`
- `components/`
- `lib/`
- `hooks/`
- `types/`
- `app/api/`
- Supabase clients
- middleware/proxy/auth files
- migrations
- README/docs if relevant

Output:

1. Repo overview
2. Route inventory
3. Page-by-page audit
4. Component inventory
5. Button and handler audit
6. Data flow audit
7. Supabase and API audit
8. Readiness verdict
9. Coach verdict
10. Evidence matching verdict
11. Application package verdict
12. Dead code and duplicate risks
13. P0/P1/P2/P3 fix plan
14. Final technical verdict

Every major claim must include file references.

