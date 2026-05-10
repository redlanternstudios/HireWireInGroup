# HireWire Generation Strategy

## Generation Intents
- ATS_OPTIMIZED
- MORE_CONCISE
- MORE_EXECUTIVE
- MORE_TECHNICAL
- MORE_LEADERSHIP
- MORE_RECRUITER_READABLE
- MORE_HIRING_MANAGER_READABLE
- MORE_METRICS_FOCUSED
- SECTION_REWRITE
- FULL_REWRITE

## Regeneration Rules
- Never allow random regenerate.
- Every regeneration requires intent.
- Default regeneration is targeted by section.
- Full rewrite requires explicit intent.
- Evidence locked is default.
- New claims require new evidence or user confirmation.
- Store full snapshots, not diffs.

## Generation Flow
1. Job analysis must exist and be valid.
2. Requirement graph must exist or be created.
3. Evidence match must meet minimum threshold or require user approval.
4. Generation intent is required for all regeneration.
5. All claims must pass constitution and quality gates before rendering.
6. Artifacts are rendered from structured claims, not freeform text.
