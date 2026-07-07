# AI provider — HireWire runs on free Google Gemini

**Decision (architecture; also log to the Notion Decision Log):** HireWire's LLM
calls run on **Google Gemini 2.5 Flash** via the free tier, replacing paid OpenAI
(gpt-4o) as the primary. Chosen for the strongest reasoning + native structured
output of the free options — closest to prior Claude/GPT cognitive quality at $0.

## How it works

All AI goes through the single chokepoint `lib/ai/gateway.ts`. Provider is chosen
by which key is present, in priority order:

1. `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`) → **Google Gemini** (free)
2. `OPENAI_API_KEY` → OpenAI (paid fallback)
3. `AI_GATEWAY_API_KEY` → Vercel AI Gateway

Models (override via env): `GEMINI_MODEL` (default `gemini-2.5-flash`),
`GEMINI_FAST_MODEL` (default `gemini-2.5-flash-lite`).

Because selection is key-based, rollout is **zero-downtime**: until the Google key
is set in an environment, that environment keeps using OpenAI. Add the key → it
switches to free Gemini on the next request. Remove it → it falls back. No code
change needed to flip.

## To enable in production (required — cannot be done from code)

1. Create a free key at **Google AI Studio → Get API key** (aistudio.google.com).
2. In **Vercel → HireWire project → Settings → Environment Variables**, add
   `GOOGLE_GENERATIVE_AI_API_KEY = <key>` for Production (and Preview).
3. Redeploy. Verify at `/api/ai/health` (or check `getAiGatewayStatus().provider === "google"`).

Local dev: the key lives in `.env.local` (gitignored).

## Verified

Live end-to-end on `gemini-2.5-flash`:
- `getAiGatewayStatus()` → `provider: google, model: gemini-2.5-flash`
- Resume parse (structured output) extracts name / experience / skills
- Entailment judge returns a cited verdict (`met` / high / `[cite:ev1]`) with sound reasoning

Structured output (`Output.object`) works on Gemini, so the fit-truth / extraction /
judge paths keep the same contracts.

## Safety note — Amina is untouched

This change is entirely within the HireWire repo (`lib/ai/gateway.ts`) and HireWire's
own Vercel env. Amina is a separate repo and Vercel project with its own AI config;
the only shared surface (the Supabase DB) is not touched here.
