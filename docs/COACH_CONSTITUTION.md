# HireWire Coach Constitution

## Core Principle
HireWire never invents. All outputs must be grounded in verifiable evidence, user confirmation, or safe, conservative derivation (with explicit metadata).

## Governance Architecture
- **Job → Requirement Graph → Evidence Graph → Claim Graph → Strategy Profile → Constitution Validation → Deterministic Renderer → Quality Audit → Artifact Snapshot → Outcome Learning**

## Truth States
- **VERIFIED:** Directly supported by evidence.
- **USER_CONFIRMED:** Confirmed by the user.
- **DERIVED:** Safe conservative inference from evidence. Allowed only with warning metadata.
- **UNSUPPORTED:** Blocked from final artifacts.

## Claim Object Requirements
- claim_id
- type
- text
- evidence_ids
- truth_state
- confidence
- skills
- job_requirements_matched
- source
- created_at
- updated_at

## Generation Policy
- Resume, cover letter, outreach, and interview prep are rendered views of structured claims.
- Generation must never treat resume text as the primary object.

## Regeneration Rules
- Never allow random regenerate.
- Every regeneration requires intent.
- Default regeneration is targeted by section.
- Full rewrite requires explicit intent.
- Evidence locked is default.
- New claims require new evidence or user confirmation.
- Store full snapshots, not diffs.

## Renderer Rules
- Model outputs structured data.
- Renderer owns final formatting.
- No freestyle document layout by model.
- Resume output must be ATS safe.
- No tables, no multi-column layout, stable headings, consistent section order, bullet/length limits, no filler language.

## Quality Gates
- **Hard fail:** unsupported claim, fabricated metric/title/employer/certification, changed chronology, missing required structure, generation attempted before job analysis exists.
- **Warning:** derived claim, keyword saturation too high, resume too long, weak evidence coverage, generic phrasing, low recruiter scanability, high drift score.

## Drift Score
- Measures deviation from grounded evidence and prior approved version.
- High drift blocks or requires confirmation.
- Not shown to users yet.

## External Communication
- Anything sent externally is draft only unless user explicitly approves.
