# DOWNSTREAM_OUTPUT_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
All AI-generated outputs: resume, cover letter, bullets, coach responses. Verify source of truth, no null overrides, no fabrication path.

## Findings

### Resume / Cover Letter Generation
- **Route:** `app/api/generate-documents/route.ts`
- **Source of truth:** Writes to `jobs.generated_resume` and `jobs.generated_cover_letter` — CORRECT
- **Dead table:** `generated_documents` — confirmed not read or written in this route
- **JSONB safety at lines 564-568:** `e.outcomes?.length ?` and `e.approved_achievement_bullets?.length ?` — optional chaining guards before `.map()` — SAFE
- **Model:** Uses `CLAUDE_MODELS` constants — CORRECT
- **Tenant isolation:** `.eq("user_id", user.id)` present on all reads
- **`[v0]` log at line 60:** Fixed → `[hirewire]`
- **Status:** PASS (1 fix applied)

### Bullet Enhancement
- **File:** `lib/bullet-enhancer.ts`
- **Evidence grounding:** Only operates on `sourceEvidence` rows passed from `evidence_library` — no hallucination path
- **JSONB:** `for (const outcome of sourceEvidence.outcomes || [])` — `|| []` acceptable here (typed internal object, not raw DB JSONB)
- **Status:** PASS

### Coach Responses
- **Model:** Was `"openai/gpt-4o-mini"` (raw string — CLAUDE.md violation) → Fixed to `CLAUDE_MODELS.HAIKU`
- **System prompt:** `COACH_SYSTEM_PROMPT` from `lib/ai/prompts/coach.ts` — grounded in user profile and job context
- **Truth enforcement:** Coach cannot access `evidence_library` directly — operates on profile summary only. No fabrication path from evidence table.
- **Status:** PASS (1 fix applied)

### Export (DOCX/PDF)
- **File:** `lib/export.ts`
- **Source:** Reads from `jobs.generated_resume` — correct canonical column
- **JSONB at lines 538, 550, 692, 710:** `.experience.map()` and `.education.map()` called on typed `ResumeData` object, not raw DB JSONB — safe
- **Status:** PASS

## Overall: PASS — 2 fixes applied, 0 remaining issues
