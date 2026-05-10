<<<<<<< HEAD
# Coach Validation

This document reviews the Coach as Career Strategist for safe, truthful, and context-aware guidance.

## Validation
- Answers quick questions briefly
- Guides step by step
- Audits pipeline
- Reviews documents
- Drafts follow ups safely
- Interview prep
- Package builder
- Explains blockers
- Avoids hallucinated app state
- Avoids inventing career claims
=======
# COACH_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
Career Coach AI: model usage, prompt injection safety, input handling, response quality, session management.

## Findings

### Model Usage
- **Was:** `"openai/gpt-4o-mini"` — raw string, CLAUDE.md violation, wrong provider
- **Fixed:** `CLAUDE_MODELS.HAIKU` — correct constant, Anthropic via AI Gateway
- **Import added:** `import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"`
- **Status:** FIXED

### Prompt Injection Safety
- 11 regex patterns in route: ignore/forget/disregard instructions, system prompt override, role replacement, `[INST]` tags, `###system` headers, `act as` jailbreaks
- Max message length: 4000 chars
- Max history: 50 messages
- All user messages validated before reaching model
- `lib/safety/injection-detector.ts` available for additional evidence-level protection
- **Status:** PASS

### Input Handling (Coach Chat UI)
- `components/coach-chat.tsx`: Local `useState("")` for input — no dependency on `useChat` input binding
- `inputValue` always a defined string — no `undefined.trim()` crash path
- `append({ role: "user", content: inputValue.trim() })` on submit — correct `useChat` API
- Quick actions use `append()` directly
- **Status:** PASS

### System Prompt
- `lib/ai/prompts/coach.ts`: Grounds coach in user's profile and job context
- Coach cannot fabricate evidence — prompt context is profile summary only
- Gap clarification mode: Passes job context without evidence_library rows — safe
- **Status:** PASS

### Session Management
- `app/api/coach/sessions/route.ts`: Creates and lists sessions with `user_id` filter
- `app/api/coach/sessions/[sessionId]/messages/route.ts`: Messages scoped to session + user
- `app/api/coach/sessions/[sessionId]/route.ts`: Session detail with user check
- **Status:** PASS

### Evidence Drafts
- `app/api/coach/evidence-drafts/[draftId]/reject/route.ts`: Auth check present
- Coach-suggested evidence drafts require user approval before entering evidence_library
- **Status:** PASS

## Overall: PASS — 1 critical fix applied (model string). 0 remaining issues.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
