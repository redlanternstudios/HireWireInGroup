# HireWire Architecture

## Overview

HireWire is an evidence-based job application engine. The active product runs
inside Next.js API routes with Supabase as the source of truth. There is no n8n
or external orchestration dependency in the current app.

```
Browser
  -> Next.js App Router UI
  -> Next.js API routes / server actions
  -> Supabase Postgres + RLS
  -> AI Gateway/OpenAI through lib/ai/gateway
```

## Current Layers

### Frontend

- Accepts job URLs and manual job entries.
- Reads job, readiness, evidence, document, and governance state from Supabase.
- Displays derived lifecycle stages instead of inventing local state.
- Routes document review and apply flows through the canonical jobs/readiness
  surfaces.

### API Routes And Server Actions

- Authenticate with Supabase session cookies.
- Filter user-owned data by `user_id`.
- Fetch and analyze job content.
- Generate resume and cover letter drafts with evidence provenance.
- Run governance, drift scoring, quality checks, and readiness recomputation.
- Persist audit records before surfacing generation results.

### AI Gateway

All active AI calls go through `@/lib/ai/gateway`.

- Plain text: `generateText()`.
- Structured JSON: `generateStructuredText()`.
- Do not use `Output.object()`, `experimental_output`, or `generateObject()`.
- Do not add Groq imports or `GROQ_API_KEY` paths.

The gateway supports `AI_GATEWAY_API_KEY` and direct `OPENAI_API_KEY`. Model
selection is centralized in `lib/ai/gateway.ts`.

### Supabase

Supabase is the durable state layer with RLS on user-scoped tables.

Core tables:

- `jobs` — job listings, lifecycle status, scores, generated resume/cover
  letter, generation state, quality state, latest governance summary.
- `user_profile` — user profile and resume-derived career context.
- `evidence_library` — verified source evidence used for matching and document
  generation.
- `job_analyses` — structured job analysis output.
- `generation_governance_runs` — one row per governed document generation
  attempt.
- `governance_claim_verdicts` — row-level claim verdicts for generated resume
  bullets and cover letter paragraphs.
- `generation_quality_checks` — quality check audit rows.
- `context_*` tables — normalized context engine graph, requirements, gap
  matches, and claim verdicts.
- `domain_events` / `run_ledger` — observability and workflow events.
- `job_resume_versions` — generated package version snapshots.

## Generation Flow

1. User submits a job URL or manual job.
2. `/api/analyze` authenticates, fetches/extracts content, and writes job
   analysis state.
3. `runJobFlow()` coordinates in-process generation.
4. `/api/generate-documents` selects evidence, builds an evidence map, generates
   resume and cover letter content, and preserves provenance IDs.
5. Claim validation and drift scoring run before persistence.
6. Governance writes:
   - `generation_governance_runs`
   - `governance_claim_verdicts`
   - `jobs.last_governance_run_id`
   - `jobs.governance_passed`
   - `jobs.governance_drift_score`
   - `jobs.governance_version`
7. Passing generations persist documents to `jobs`; blocked generations persist
   the audit trail and return a governance error.
8. Quality checks and readiness recomputation update downstream UI state.

## Governance Rules

- A fabricated claim blocks generation.
- Drift score `>= 65` blocks document persistence.
- Unsupported-tool warnings must not fire for ordinary business proper nouns.
- Missing or stale provenance IDs may be inferred only when the claim clearly
  matches existing evidence by content.
- Every governed generation that reaches the governance phase should produce an
  auditable governance run.

## Job Lifecycle

Canonical generation states:

```
pending -> generating -> ready
                     -> needs_review
                     -> failed
```

Canonical pipeline/status stages include:

```
queued -> analyzing -> analyzed -> generating -> ready -> applied
                                           -> needs_review
                                           -> error
```

Readiness is derived from artifacts, quality, evidence, gaps, and voice
integrity. Do not use local UI-only state as readiness truth.

## Environment Variables

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key for server-only operations |
| `AI_GATEWAY_API_KEY` | Yes, unless using OpenAI direct | Vercel AI Gateway key |
| `OPENAI_API_KEY` | Yes, unless using AI Gateway | Direct OpenAI key fallback |

Deprecated:

- `GROQ_API_KEY`
- `N8N_JOB_INTAKE_WEBHOOK_URL`
- `N8N_JOB_INTAKE_WEBHOOK_TOKEN`

## Builder Constraints

- Read generated materials from `jobs.generated_resume` and
  `jobs.generated_cover_letter`.
- Do not use a `generated_documents` relation as the active document source.
- Always guard JSONB fields with `Array.isArray()` or object checks before
  mapping.
- Always preserve `user_id` filters in user-scoped queries.
- Keep Supabase migrations in `supabase/migrations`; legacy `scripts/` SQL files
  are historical/bootstrap references unless explicitly promoted.
- Use `generateStructuredText()` for structured JSON and provide a concise
  `schemaDescription`.
