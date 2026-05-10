<<<<<<< HEAD
# Truth and Claim Safety Validation

This document reviews the truth spine and claim safety in HireWire, ensuring no unsupported or fabricated claims are generated.


## Rules

- No invented employers, titles, certifications, degrees, metrics, tools, industries, team sizes, years, awards, clients, launches, work authorization, clearance, application/interview/ready status.

## Validation

- Every resume bullet must have evidence or be flagged.
- Every high value claim must have provenance.
- Humanizer must not introduce claims.
- User edits must be rechecked.
- quality_passed only via canonical route.
- Ready to Apply only if readiness is proven.

## Key Areas

- evidence_library structure
- source_resumes parsing
- user_profile fields
- resume_provenance
- jobs.evidence_map
- generated_resume
- generated_cover_letter
- quality_passed
- app/api/generate-documents/route.ts
- app/api/jobs/[jobId]/quality-pass/route.ts
- red team logic
- humanizer logic
- package builder logic
=======
# TRUTH_AND_CLAIM_SAFETY_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
Verify HireWire never fabricates claims. Every generated statement must be grounded in `evidence_library` rows. Truth enforcement layer must be active.

## Findings

### Safety Library
- **`lib/safety/`** contains: `content-moderator.ts`, `injection-detector.ts`, `pii-detector.ts`, `index.ts`
- All present and importable — not dead code

### Canonical Evidence Normalization
- **`lib/canonical-evidence.ts`:** Normalizes evidence rows before generation
- **`Array.isArray()` usage:** `Array.isArray(data.links)` and `Array.isArray(profile.experience)` guards present
- **`|| []` patterns at lines 396, 414-416:** Used on spread operations on typed objects — not raw DB JSONB. Acceptable.
- **Status:** PASS

### TruthSerum (Claim Verification)
- **`lib/truthserum.ts`:** Active — used during generation pipeline
- **Evidence grounding check:** Cross-references generated claims against `evidence_library` records
- **`|| []` patterns:** Lines 407, 424, 454 — used on typed evidence objects post-normalization. Acceptable.
- **Status:** PASS

### Gap Detection
- **`lib/gap-detection.ts`:** Used to surface missing evidence before generation
- **Prevents fabrication:** Gaps are flagged to user — not silently filled by AI
- **Status:** PASS

### is_user_approved Flag
- **Generation pipeline:** Checks `is_user_approved` on evidence items
- **Low confidence items:** `confidence_score < 0.5` is flagged — not silently used
- **Status:** PASS

### Never-Fabricate Enforcement
- No route allows AI to generate resume/cover letter content without an `evidence_library` evidence set passed in prompt context
- Coach route cannot write to `jobs.generated_resume` — read-only relationship
- **Status:** PASS

## Overall: PASS — 0 critical issues
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
