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
