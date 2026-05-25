# HireWire Architecture Context

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind v4
- shadcn/Radix primitives
- Supabase Auth/Postgres/Storage
- AI SDK / OpenAI-compatible gateway
- Stripe
- Zapier/MCP integrations

## Main Directories

| Directory | Purpose |
| --- | --- |
| `app/(dashboard)/` | Authenticated application pages |
| `app/(auth)/` | Login/signup/auth pages |
| `app/api/` | Route handlers |
| `components/` | Shared UI and product components |
| `lib/` | Server actions, domain logic, Supabase, AI, readiness, evidence |
| `lib/readiness/` | Canonical readiness evaluator |
| `lib/actions/` | Server actions |
| `lib/evidence/` | Evidence matching and mapping |
| `lib/domain-events/` | Event/invalidation system |
| `supabase/migrations/` | Append-only schema migrations |
| `.agent/` | Build/review coordination |
| `.ai/` | Cross-agent operating layer |

## Current Architecture Risks

- Readiness has had duplicate helpers. Route all readiness truth through `lib/readiness/evaluator.ts`.
- Coach has multiple paths. Avoid adding another coach/session/save path.
- Package review has had duplicate action modules. Do not add another package lifecycle.
- Client-side writes to important domain tables can bypass domain events. Prefer server actions for new mutations.
- `app/api/generate-documents/route.ts` is high-risk and broad. Inspect the full route before changing it.

