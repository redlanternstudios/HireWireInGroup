# HireWire Build Day 16 — Build Context

## Sprint Goal

Stabilize the document generation pipeline. No new product features during this sprint.

## Current State

The generation spine is:

```
Generate → Review → Ready to Apply → Apply
```

The `POST /api/generate-documents` route is the entry point. It orchestrates:
1. Evidence mapping (structured AI output)
2. Resume generation (structured AI output)
3. Cover letter generation (structured AI output)
4. Quality check (structured AI output, already guarded with try/catch)
5. Governance scoring (drift + fabrication detection)
6. Final Supabase writes (jobs, provenance, governance runs, quality checks)

## Active Problems

### 1. Structured Output Provider Mismatch
`Output.object({ schema })` from the AI SDK requires the provider to support `json_schema` response format. When the configured model does not support it (e.g. certain Groq or gateway models), the call throws and the route returns 400. The three unguarded `experimental_output!` accesses propagate the throw directly.

### 2. Supabase Schema Drift
Some columns written by the route do not exist in all deployed environments (preview, staging, production). Affected columns include:
- `jobs.generation_attempts`
- `jobs.last_generation_at`
- `jobs.resume_provenance`
- `jobs.voice_integrity_passed`
- `jobs.voice_review_status`

Write failures against missing columns cause the final job update (which gates the 200 response) to return 500.

### 3. Governance Table Persistence
The `generation_governance_runs` table may not be migrated in all environments. The success-path insert does not crash the route (Supabase client returns error object, not throw), but the failure-path insert already has a silent swallow. Both need consistent handling.

### 4. UI Error Handling
`GenerateButton` displays a generic error message. When generation is blocked (governance block, evidence missing, quality failure), the backend returns a structured reason in the response body that the button does not surface.

## What Is Out of Scope This Sprint

- New product features
- UI redesign or new pages
- New evidence flows
- New AI prompts or generation strategies
- Changes to readiness evaluator
- Changes to apply gate

## Canonical Files

| File | Role |
|---|---|
| `app/api/generate-documents/route.ts` | Generation spine — all AI calls and writes |
| `lib/ai/gateway.ts` | AI provider wrapper — model selection, timeout, telemetry |
| `lib/readiness/evaluator.ts` | Canonical readiness authority — do not modify |
| `lib/actions/apply.ts` | Only apply mutation path — do not modify |
| `app/(dashboard)/jobs/[id]/GenerateButton.tsx` | Client-side trigger — needs real error surfacing |
| `supabase/migrations/` | Schema migrations — must be idempotent |

## Environment Notes

- AI provider is resolved at runtime via `lib/ai/gateway.ts`
- `OPENAI_API_KEY` → uses OpenAI directly
- `AI_GATEWAY_API_KEY` starting with `sk-` → treated as OpenAI
- `AI_GATEWAY_API_KEY` not starting with `sk-` → routes through gateway (OpenAI-compatible, model set via `OPENAI_MODEL` env var)
- Default model: `gpt-4o` (supports `json_schema`)
- If environment overrides model to one that lacks `json_schema` support, structured output calls currently throw

## CLAUDE.md Rules That Apply

- All schema changes must be idempotent (safe to re-run)
- Never trust `user_id` from request input — always scope to authenticated user
- Never silently swallow Supabase errors — log with `[HireWire]` prefix
- JSONB columns: guard with `Array.isArray()` before `.map()`
- Do not use `jobs.status === "ready"` as readiness truth
- `lib/readiness/evaluator.ts` is the canonical readiness authority
