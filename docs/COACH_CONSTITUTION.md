<<<<<<< HEAD
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
=======
# COACH_CONSTITUTION.md
# HireWire Coach Governance Invariants
# Version: 1.0.0 | Enforced from: 2026-05

---

## Purpose

This document defines the immutable rules that govern every AI-generated output
in HireWire. These are not style guidelines — they are hard constraints enforced
in code (`lib/coach/`) that the generation pipeline cannot bypass.

Violating any invariant marked **HARD BLOCK** results in a 400 response, no DB
write, and the job status is set to `"error"`.

---

## The Three Pillars

### 1. Evidence Primacy

Every claim in a generated document must be traceable to a row in `evidence_library`.

- A bullet citing `evidence_id: "abc"` must have a matching record with `id = "abc"`.
- Metrics in bullets must be within 15% of the largest number found in that evidence record.
- Outcomes not present in `evidence.outcomes[]` or `evidence.approved_achievement_bullets[]` must not appear as facts.

**HARD BLOCK**: Any bullet with `claim_verdict.confidence = "fabricated"` blocks the generation.

### 2. Metric Non-Inflation

Numbers in generated output may not exceed 2x the largest number found in the cited evidence record.

- If evidence says "team of 5", a bullet may not say "team of 12".
- If evidence has no monetary figures, a bullet may not cite revenue impact.
- Percentages with no source in evidence (`outcomes[]`) must not appear.

**HARD BLOCK**: `drift_flag.category = "metric_inflation"` with `severity = "block"` stops generation.

### 3. Scope Non-Expansion

A candidate's role scope may not be inflated beyond what the evidence supports.

- `evidence.what_not_to_overstate` is a user-set constraint and must be honored.
- Job titles in bullets may not be promoted above the title in `evidence.source_title`.
- If `evidence.team_size` is set, team size claims must not exceed it by more than 50%.

**HARD BLOCK**: `drift_flag.category = "scope_expansion"` with `severity = "block"` stops generation.

---

## Strategy Decision Tree

See `docs/GENERATION_STRATEGY.md` for the full decision tree.

| Coverage | Evidence Quality | Strategy          |
|----------|-----------------|-------------------|
| ≥80%     | ≥70%            | `full_match`      |
| ≥65%     | any             | `strong_match`    |
| 40–64%   | any             | `partial_match`   |
| 25–39%   | any             | `honest_stretch`  |
| <25%     | any             | `do_not_generate` |

**HARD BLOCK**: `strategy = "do_not_generate"` means no resume, no cover letter, no DB write.

---

## Drift Score Gate

The `drift-scorer.ts` module computes a score from 0–100:
- 0 = perfect fidelity to evidence
- 100 = entirely fabricated

**HARD BLOCK**: `drift.score >= 40` blocks the generation regardless of other checks.

---

## Banned Language

The following phrases MUST NOT appear in any generated output:

- results-driven, results driven
- dynamic professional
- seasoned leader
- proven track record
- team player
- spearheaded
- passionate about
- self-starter, go-getter
- synergize, synergies
- leverage (as a verb)
- best-in-class, thought leader
- move the needle, circle back
- hard-working, detail-oriented
- out-of-the-box, game changer

These are enforced by `drift-scorer.ts` as `banned_phrase` flags (severity: warning).
Three or more banned phrases in a single generation raises the drift score enough
to trigger a block.

---

## Evidence Confidence Gates (Pre-Generation)

Before generation begins:

- Items with `is_user_approved = false` may not be used as primary evidence.
- Items with `confidence_level = "low"` may be used for context but not for metric claims.
- If zero `confidence_level = "high"` items exist, the strategy is capped at `partial_match`.

---

## Governance Version

The governance version is stored in `generation_governance_runs.governance_version`.
When these rules change, increment the version and document the change here.

Current version: `1.0.0`

---

## Immutability Commitment

These invariants cannot be weakened without:
1. A documented rationale in this file
2. A version bump
3. An updated migration in `scripts/migrations/`

The goal is simple: every user of HireWire can stand behind every word in their
generated application materials. We do not win by making people look better on paper.
We win by helping them surface real experience more effectively.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
