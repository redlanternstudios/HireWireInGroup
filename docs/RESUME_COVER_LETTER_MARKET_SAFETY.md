<<<<<<< HEAD
# Resume and Cover Letter Market Safety

This document validates the generation of resumes and cover letters for evidence grounding, specificity, and user confidence.


## Validation

- Generation uses Career Context
- Generation uses job requirements
- Evidence matched to requirements
- No keyword stuffing
- No invented metrics
- No generic AI phrases
- ATS safe output
- Human sounding output
- Risks and gaps shown
- User confidence approval step
- Flagged sections clear
- Quick questions limited/high impact
- Deeper review optional
- Fast mode efficient
- Deep tailor optional and safe

## Modes

- Fast Draft: quick, quality checked, 0-2 questions, confidence shown, approval/deeper review
- Guided Review: flagged sections, 1-3 questions, not forced
- Deep Tailor: optional, for high value jobs, truth protected
=======
# RESUME_COVER_LETTER_MARKET_SAFETY.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
Resume and cover letter generation safety: claim accuracy, tone, no false credentials, no fabricated dates, no invented employers.

## Findings

### Evidence Grounding
- All resume/cover letter generation flows through `app/api/generate-documents/route.ts`
- Evidence is fetched from `evidence_library` with `.eq("user_id", user.id)` before prompt construction
- No path exists to generate a resume without fetching the user's actual evidence first
- **Status:** PASS

### Date / Employer Accuracy
- `canonical-evidence.ts` normalizes `date_range`, `company_name`, `source_title` from real evidence rows
- AI prompt explicitly includes these fields — AI is instructed to use them verbatim
- No date invention path exists in the prompt template
- **Status:** PASS

### Credential Claims
- Certifications and education come from `evidence_library` rows with `source_type = "certification"` or `"education"`
- AI cannot add certifications not in evidence library
- **Status:** PASS

### Quality Pass Gate
- Documents must pass quality review before `generation_status` advances
- **One quality-pass route confirmed:** `app/api/jobs/[jobId]/quality-pass/route.ts` — no duplicates found
- **Status:** PASS

### Column Source of Truth
- Resume content read from `jobs.generated_resume` — correct
- `generated_documents` table confirmed dead — not read in any route
- **Status:** PASS

### Export Safety
- DOCX/PDF export in `lib/export.ts` reads directly from generated content — no re-generation on export
- No chance of export producing different content than what user reviewed
- **Status:** PASS

## Overall: PASS — 0 critical issues
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
