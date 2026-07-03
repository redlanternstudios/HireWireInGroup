# Matching & Extraction — labeled evaluation set (Phase 0)

Phase 0 of the Semantic Matching & Requirement Extraction spec, and its precondition:
*every 0.65 / 0.35 threshold is a guess until this set exists.* This is the standing
regression gate for both subsystems — extraction cleaning and semantic matching are
measured against it, and no threshold flips live until agreement clears the bar.

## What it is
~100 `(requirement, evidence, current-matcher-verdict)` triples drawn from the live
corpus (84 jobs, 227 evidence rows → 782 unique requirement triples). The sampler
front-loads the **highest-signal** rows: `met`/`partial` matches that already carry a
matcher risk flag (e.g. `seniority_mismatch`), plus `required`-priority items and a
spread of verdicts. In the first run, **92 / 100 carried a risk flag** — i.e. the set
concentrates on where the current matcher is most likely wrong.

## Build it
```
export NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
node scripts/eval/build-labeled-set.mjs 100 out.csv
```
Output columns: `job, requirement, priority, matcher_status, matcher_method,
matcher_risk, evidence, human_verdict, human_notes`.

> **Privacy:** the sheet contains real user evidence. Do **not** commit the generated
> CSV. Only the assembler + this README live in the repo; the sheet is delivered
> privately for judging.

## How to judge (one human decision per row)
Fill `human_verdict` — this single sheet calibrates **both** subsystems:

| verdict | meaning | feeds |
|---|---|---|
| `met` | evidence clearly satisfies the requirement, including seniority / depth | matching |
| `partial` | related but under-qualified, thin, or off on level | matching |
| `gap` | evidence does not satisfy the requirement | matching |
| `not_a_requirement` | the "requirement" is boilerplate — a header, label, or company-values line, not a real requirement | **extraction** |

Rules (from the spec):
- Judge **entailment**, not word overlap — *does this evidence satisfy this requirement?*
- Seniority and depth count: "6 yrs Python" for a "5 yrs Java" ask is at most `partial`;
  "was on a team" for "led a team" is `partial`, not `met`.
- When unsure, prefer the more conservative verdict. Human judgment is the ground truth;
  the matcher columns are shown only so you can see where it disagrees.

## What it gates (roadmap)
1. **Phase 0** — this set (human-judged). ← you are here
2. **A1** — content-stable requirement ids + re-key `prove_fit_decisions` (blocker).
3. **A2** — clean extraction (forward-only); target boilerplate < 5% on this set.
4. **B / Phase 3–4** — pgvector retrieval + entailment verdict, run in **shadow**,
   required to reach **≥ 90% agreement** with this set before it feeds the live gate.
5. **Phase 5** — calibrate thresholds, flip live behind a flag.

Metrics this set measures: judge↔human agreement (target ≥90%), share of `met` verdicts
carrying a citation (target 100%), extraction boilerplate rate (target <5%).
