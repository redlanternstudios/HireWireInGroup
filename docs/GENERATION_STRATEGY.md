# GENERATION_STRATEGY.md
# HireWire Generation Strategy Decision Tree
# Version: 1.0.0

---

## Overview

The generation strategy is resolved by `lib/coach/generation-strategy.ts`
immediately after the evidence map is built. It is the primary control surface
that determines how the AI writes — and whether it writes at all.

The strategy is derived from two inputs:
1. **Requirement coverage** — what percentage of required qualifications the
   evidence_library covers, as computed by the evidence-map step.
2. **Evidence quality** — percentage of evidence items with `confidence_level = "high"`.

---

## Decision Tree

```
requirementCoverage < 25%
    └── strategy = do_not_generate (HARD BLOCK)

requirementCoverage 25–39%
    └── strategy = honest_stretch
        - Transferable framing required
        - Cover letter acknowledges growth opportunity
        - "adjacent experience" / "related experience" language only

requirementCoverage 40–64%
    └── strategy = partial_match
        - Honest gaps acknowledged in cover letter
        - Strengths highlighted clearly
        - No stretch claims

requirementCoverage 65–79%
    └── strategy = strong_match
        - Write with confidence
        - Use evidence carefully for any metric claims
        - Minor gaps can be addressed with transferable framing

requirementCoverage ≥80% AND evidenceQuality ≥70%
    └── strategy = full_match
        - Write with full confidence
        - Lead with strongest differentiators
        - Include all relevant metrics from evidence

requirementCoverage ≥80% AND evidenceQuality <70%
    └── strategy = strong_match (evidence quality insufficient for full_match)
```

---

## Strategy Prompt Fragments

Each strategy injects a specific instruction block into the resume and cover
letter generation prompts. These are defined in
`lib/coach/generation-strategy.ts::STRATEGY_PROMPT_FRAGMENTS`.

The fragments:
- Tell the AI how confident to sound
- Define what framing is permitted
- Prohibit specific language patterns for stretch strategies

---

## do_not_generate Triggers

Beyond coverage thresholds, `do_not_generate` is also triggered when:

1. **Direct fabrication risk detected** — if the pre-flight evidence check
   determines that the required qualifications cannot be covered without
   inventing claims, `hasDirectFabricationRisk = true` is passed to the resolver.

2. **Post-generation drift block** — if `drift.score >= 40` after generation,
   the job status is set to `"error"` and the documents are NOT persisted, even
   if the strategy was `full_match`. This is enforced in the generation route
   after the governance layer runs.

---

## Strategy Persistence

The selected strategy is stored in:
- `jobs.resume_strategy` — the string enum value
- `jobs.score_reasoning.strategy` — full strategy decision object (JSON)
- `generation_governance_runs.strategy_decision` — full JSONB record per run

This allows auditing and retroactive analysis of why a document was generated
with a particular framing.

---

## Changing Thresholds

Threshold changes require a version bump in `COACH_CONSTITUTION.md` and a
comment in `lib/coach/generation-strategy.ts::THRESHOLDS`.
