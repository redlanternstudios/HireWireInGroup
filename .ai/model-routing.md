# Model Routing Rules

## Local Models (Ollama)

Use for:
- Small refactors within a single file
- Explaining local files and functions
- Summarizing code or git diffs
- Writing unit tests
- Drafting inline comments
- TypeScript type issues in isolation
- Any work on files that must not leave the machine

Preferred local models:
- **CodeGemma** → inline completion, small patches
- **Gemma 3** → local reasoning, explain/summarize (Gemma 4 not yet stable in Ollama)
- **Qwen 2.5 Coder** → stronger local patches when CodeGemma struggles

## Cloud Models (Claude)

Use for:
- Multi-file changes
- Architecture and product decisions
- Supabase RLS design and review
- Authentication and authorization logic
- Upstream/downstream impact analysis
- Billing and contract logic
- Production release audits
- Readiness evaluator changes
- Generation spine changes
- Governance scoring changes
- `.agent/CLAUDE_REVIEW.md` completion (Claude's designated review role)

## Never Let Local Models Be Final Authority On

- Authentication (`lib/supabase/server.ts`, `lib/supabase/middleware.ts`)
- Authorization (RLS policies, tenant scoping)
- Billing (`lib/contracts/hirewire.ts`, `app/(dashboard)/billing/`)
- Readiness logic (`lib/readiness/evaluator.ts`)
- Apply gate (`lib/actions/apply.ts`, `app/(dashboard)/ready-to-apply/`)
- Generation spine (`app/api/generate-documents/route.ts`)
- Governance scoring (`lib/coach/drift-scorer.ts`, `lib/coach/claim-validator.ts`)
- Data deletion
- Production migrations

## HireWire AI Provider (runtime, not Ollama)

The app itself resolves its AI provider at runtime via `lib/ai/gateway.ts`:
- `OPENAI_API_KEY` → OpenAI direct
- `AI_GATEWAY_API_KEY` starting with `sk-` → OpenAI direct
- `AI_GATEWAY_API_KEY` not starting with `sk-` → OpenAI-compatible gateway
- Default model: `gpt-4o` (supports `json_schema` structured output)
- If `OPENAI_MODEL` is overridden to a model without `json_schema` support, structured output calls will fail — see BUILD_CONTEXT.md AC-1
