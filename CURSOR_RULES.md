# HireWire — Cursor / AI Coding Rules

Cursor and AI coding assistants working in this repository must read this file fully.
For the complete coding constitution, see `.github/copilot-instructions.md`.

---

## Section 1 — What HireWire Is

HireWire is a truth-based job application intelligence platform. Every generated word must be traceable to real, user-approved evidence in `evidence_library`. No hallucination, no inflation, no fabrication.

---

## Section 2 — Non-Negotiable Authorities

| Authority | File |
|-----------|------|
| Readiness | `lib/readiness/evaluator.ts` — only source of readiness truth |
| Apply | `lib/actions/apply.ts` — only apply mutation path |
| Apply gate | `app/(dashboard)/ready-to-apply/page.tsx` |
| Generation | `app/api/generate-documents/route.ts` |
| Evidence | `lib/canonical-evidence.ts` |

---

## Section 3 — State Model

`jobs.status` is outcome/history state only. Readiness truth lives in `lib/readiness/evaluator.ts`.

Do not use `jobs.status === "ready"` as readiness truth. Do not create a second readiness engine.

---

## Section 4 — Auth and Tenant Isolation

- Use `requireUser()` from `lib/supabase/require-user.ts` at the top of every API route.
- Every Supabase query must include `.eq("user_id", userId)` — no exceptions.
- Never trust `user_id` from request input.

---

## Section 5 — Server vs Client Components

- Pages in `app/(dashboard)/` are Server Components by default.
- Add `"use client"` only for hooks, browser APIs, or event handlers.
- Never use `useEffect` for primary data fetching.

---

## Section 6 — JSONB Safety

```ts
// Correct
const items = Array.isArray(data.column) ? data.column : [];
// Forbidden
const items = data.column || [];
```

---

## Section 7 — Column Name Map

| Table | Use | Never use |
|-------|-----|-----------|
| `jobs` | `role_title` | `title` |
| `jobs` | `company_name` | `company` |
| `source_resumes` | `file_name` | `filename` |
| `source_resumes` | `parsed_text` | `content_text` |

---

## Section 8 — Error Handling

Never silently swallow Supabase errors. Always log with `console.error("[HireWire] ...")`.

---

## Section 9 — Document Generation Rules

Generated documents must be grounded in `evidence_library`. Content source of truth: `jobs.generated_resume` and `jobs.generated_cover_letter`. Do not read from a `generated_documents` table.

---

## Section 10 — Coach Governance

`lib/coach/claim-validator.ts` and `lib/coach/drift-scorer.ts` are enforced blockers — not style guidelines. Violating them causes a 400. See `docs/COACH_CONSTITUTION.md`.

---

## Section 11 — UI / Design System

Use `hw-*` design system classes and shadcn/ui primitives. Use `cn()` for conditional classes. Use `gap-*` not `space-*` for spacing between elements.

---

## Section 12 — Build Verification

After any readiness, route, API, schema, auth, or generation change:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Section 13 — Canonical Routes

Do not add sidebar routes for: `/jobs/[id]/red-team`, `/jobs/[id]/interview-prep`, `/companies`, `/templates`, `/manual-entry`.

---

## Section 14 — Generation Spine (never break)

```
Generate → Review → Ready to Apply → Apply
```

---

## Section 15 — SightEngine

Every important action must log a `SightEvent` via `emitSightEvent()`. Never let telemetry failure break UX — always fire-and-forget. See `lib/sightengine/`.

---

## Section 16 — By Red OS Active Operating Rules (Lesson Ledger)

Permanent operating constraints for all AI assistants in this workspace.
Source of truth: `/workspaces/HireWireInGroup/LESSON_LEDGER.md`
Auto-synced by `byred-session-brain` on every session close.

| ID | Domain | Rule |
|----|--------|------|
| LL-001 | general | Always run `byred-pre-flight` before generating any strategic brief, proposal, or outbound communication. |
| LL-002 | general | Stage outbound communications as drafts — never send email, iMessage, or Notion canonical writes without Ro approval. |
| LL-003 | skills | Every skill must embed all static IDs (Supabase project, Monday board, Notion page) so Claude never looks them up mid-execution. |
| LL-004 | operations | Save session logs and lesson ledger in Supabase (By Red, LLC. project) and as .md files — not in Notion (unpaid tier). |

---

*Last synced: 2026-05-27*
