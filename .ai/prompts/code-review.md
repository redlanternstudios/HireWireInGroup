# Code Review Prompt

Review the selected code. Apply HireWire rules from CLAUDE.md and `.ai/local-agent-rules.md`.

Check:
1. TypeScript errors and unsafe type assertions
2. Runtime errors (null access, unguarded JSONB `.map()`)
3. Broken or missing imports
4. Next.js App Router misuse (server/client boundary, hooks in server components)
5. Supabase client misuse (client-side admin calls, missing user scoping)
6. Missing loading, error, or empty states
7. Readiness authority violations (anything computing readiness outside `lib/readiness/evaluator.ts`)
8. Apply path violations (any apply mutation outside `lib/actions/apply.ts`)
9. Column name errors (see `.ai/local-agent-rules.md` column map)
10. Security issues: unscoped user queries, missing auth checks, trusting `user_id` from input

Return:
- **Strong**: what is correct and should be preserved
- **Broken**: confirmed errors with file and line reference
- **Risky**: patterns that could fail in edge cases
- **Changed files**: exact list
- **Minimal fix**: patch only what is necessary
- **Test command**: `npx tsc --noEmit && npm run build`
- **Rollback**: how to undo

Do not rewrite everything. Patch only what is necessary.
