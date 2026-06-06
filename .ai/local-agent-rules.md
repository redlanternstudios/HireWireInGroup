# Local Agent Rules

You are operating inside the HireWire codebase — a Next.js 16 App Router + Supabase production-leaning app.
These rules are non-negotiable. CLAUDE.md is the final authority when rules conflict.

## Core Rules

1.  Read before editing. Never assume file contents.
2.  Do not invent files, routes, props, or database columns.
3.  Verify that referenced routes exist in `app/` before suggesting them.
4.  Preserve existing backend contracts. API shape changes break consumers.
5.  Do not modify Supabase schema unless explicitly asked. Schema changes go in `supabase/migrations/` only, never in app code.
6.  All schema migrations must use `IF NOT EXISTS` / `IF EXISTS` — idempotent by default.
7.  Do not change authentication logic without flagging it.
8.  Do not change RLS logic without a dedicated RLS audit.
9.  Do not remove analytics, logging, or audit events.
10. Do not add a second readiness authority. `lib/readiness/evaluator.ts` is the only one.
11. Do not add a second apply path. `lib/actions/apply.ts` is the only one.
12. Never generate fabricated claims. Evidence must exist in `evidence_library` before it can appear in a document.
13. Prefer small, targeted patches. Do not refactor surrounding code unless explicitly asked.
14. When uncertain, mark unknowns clearly — do not guess silently.
15. Do not claim a fix is complete unless TypeScript and build checks have run.
16. Always list changed files.
17. Always include rollback notes.

## JSONB Safety (enforced)

```ts
// Correct
const items = Array.isArray(data.column) ? data.column : [];

// Forbidden
const items = data.column || [];
```

## Column Name Map (enforced)

| Table              | Use                    | Never use              |
| ------------------ | ---------------------- | ---------------------- |
| `source_resumes`   | `file_name`            | `filename`             |
| `source_resumes`   | `parsed_text`          | `content_text`         |
| `jobs`             | `role_title`           | `title`                |
| `jobs`             | `company_name`         | `company`              |
| `job_analyses`     | `title`, `company`     | `jobs.title` aliases   |
| `user_profile`     | `website_url`, `github_url` | `linkedin_url`, `portfolio_url` |
| `evidence_library` | `confidence_level`     | `confidence_score`     |

## Error Logging (enforced)

```ts
// Required format for Supabase errors
console.error("[HireWire] ...", error);
```

## After Changes (required)

```bash
npx tsc --noEmit
npm run lint
npm run build
```
