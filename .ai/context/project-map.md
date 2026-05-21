# Project Map — HireWireInGroup

## Repo
Name: HireWire
Branch: main
Org: RedLantern Studios (Vercel)

## Key Directories

| Directory | Purpose |
|---|---|
| `app/(dashboard)/` | All authenticated pages (jobs, coach, documents, evidence, analytics, etc.) |
| `app/(auth)/` | Login, auth flows |
| `app/api/` | API routes (generate-documents, coach, stripe, zapier, jobs) |
| `components/` | Shared UI (sidebar, job cards, apply button, etc.) |
| `lib/` | Utilities, Supabase clients, server actions, readiness, evidence, governance |
| `lib/readiness/` | Canonical readiness authority — `evaluator.ts` |
| `lib/actions/` | Server actions — `apply.ts` is the only apply mutation |
| `lib/coach/` | Claim validation, drift scoring, governance |
| `lib/evidence/` | Evidence matching, normalization, synonyms |
| `lib/domain-events/` | Domain event system — invalidation map, recompute triggers |
| `lib/ai/` | AI provider gateway |
| `lib/contracts/` | `hirewire.ts` — billing/product contract |
| `supabase/migrations/` | Schema history — append only, idempotent |
| `.agent/` | Sprint coordination (Codex builds, Claude reviews, Ro approves) |
| `.ai/` | AI tool operating layer (this directory) |

## Current Sprint Focus (Build Day 17)

Governance pipeline shipped. Prior sprint (Build Day 16) focused on stabilizing the generation pipeline:
- Structured output fallback for non-json_schema models (AC-1)
- Governance block reason surfaced in GenerateButton UI (AC-2)
- Missing governance tables resolved by migration (AC-3)
- Missing jobs columns resolved by migration (AC-4)
- Schema mismatch on job update resolved (AC-5)
- Structured Supabase error logging (AC-6)

Evidence system active:
- `lib/evidence/buildEvidenceMapForJob.ts`
- `lib/evidence/matchRequirementToEvidence.ts`
- `lib/evidence/normalizeRequirement.ts`
- `lib/evidence/evidenceSynonyms.ts`
- `lib/evidence/types.ts`
- Migration: `scripts/004_harden_evidence_source_types.sql`

## Canonical Routes (sidebar)

See CLAUDE.md §6 for full route table. Key gates:
- `/ready-to-apply` — apply gate (all apply CTAs must route here)
- `/jobs/[id]` — job detail and progress
- `/jobs/[id]/evidence-match` — evidence gaps
- `/jobs/[id]/documents` — generated materials review

## Non-Canonical Routes (do not link)

- `/jobs/[id]/red-team`
- `/jobs/[id]/interview-prep`
- `/companies`
- `/templates`
- `/manual-entry`
- `/ready-queue` (compatibility redirect only)
- `/career-context` (compatibility redirect only)

## Known Incomplete / Watch Areas

- Evidence event wiring (domain events not yet fully wired to evidence mutations)
- Supabase migration application (pending apply to production)
- MCP/Zapier env wiring
- `simulate_full_flow.ts` in `tests/` — end-to-end simulation script, not yet in CI
