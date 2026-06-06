# Stack — HireWire

## Runtime
- Framework: Next.js 16.2.0 (App Router)
- Language: TypeScript 5.7.3
- Runtime: Node.js (Vercel serverless)
- Package manager: npm (package-lock.json)

## Frontend
- Styling: Tailwind CSS v4.2.0 (NOT v3 — `@apply` and utility classes, no `theme()` calls)
- Components: shadcn/ui
- Themes: next-themes 0.4.6
- Icons: (check `components/` for active icon library)

## Backend
- Database: Supabase Postgres with Row Level Security
- Auth: Supabase Auth
- Client: `lib/supabase/server.ts` (server), `lib/supabase/client.ts` (browser)
- Middleware: `lib/supabase/middleware.ts`

## AI / Generation
- Provider: Runtime-resolved via `lib/ai/gateway.ts`
  - `OPENAI_API_KEY` → OpenAI direct
  - `AI_GATEWAY_API_KEY` starting `sk-` → OpenAI direct
  - `AI_GATEWAY_API_KEY` not starting `sk-` → OpenAI-compatible gateway
- Default model: `gpt-4o` (supports `json_schema` structured output)
- Model override: `OPENAI_MODEL` env var (must support `json_schema` for generation to work)
- AI SDK: Vercel AI SDK (`generateText`, `Output.object`)

## Payments
- Stripe (webhook at `app/api/stripe/webhook/route.ts`)
- Contract: `lib/contracts/hirewire.ts`

## Integrations
- Zapier outgoing: `app/api/zapier/outgoing/route.ts`
- MCP tools: available via claude.ai integrations (Supabase, Zapier, etc.)

## Hosting
- Platform: Vercel (RedLantern Studios org)
- Environment: preview branches + production

## Local AI (developer tooling only — not in app)
- Ollama: CodeGemma (completion), Gemma 3 (reasoning), Qwen 2.5 Coder (patches)
- Continue.dev: `~/.continue/config.json`
