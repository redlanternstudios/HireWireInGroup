<<<<<<< HEAD
# Downstream Output Validation

This document reviews all outputs HireWire presents to users for branding, truth, evidence grounding, and risk of unsupported claims.

## Outputs


1. Job cards
2. Job detail pages
3. Fit scores
4. Readiness stages
5. Next best actions
6. Coach responses
7. Resume drafts
8. Cover letter drafts
9. Application package drafts
10. Exported DOCX files
11. Copied text
12. External recruiter/referral/follow up drafts
13. Emails
14. Toasts
15. Banners
16. Empty states
17. Error states
18. Billing messages
19. Application status messages
20. Analytics and insights
21. Logs or activity history
22. Notifications
23. Open Graph previews and metadata

For each output:

- [ ] Is it branded?
- [ ] Is it truthful?
- [ ] Is it evidence grounded?
- [ ] Can a user mistake it for verified when it is not?
- [ ] Does it expose internal table names?
- [ ] Does it expose provider branding?
- [ ] Does it expose raw errors?
- [ ] Does it claim readiness without proof?
- [ ] Does it imply application submission without state?
- [ ] Does it include unsupported claims?
- [ ] Does it give the user a next action?
=======
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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
