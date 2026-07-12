# Generation Integrity Plan — kill requirement-shaped fabrication

**Finding (2026-07-08 traceability audit, verified against code):** the generator
fills job-requirement gaps with invented experience. This is not random
hallucination — it is *requirement-shaped fabrication*: unsupported bullets map
1:1 to job requirements the seed profile can't cover, and they land in floating
sections ("Additional Relevant Experience") outside employer/title/date blocks
where they're hardest to falsify.

**Verified root causes in `app/api/generate-documents/route.ts`:**

1. **Citation is decorative, not enforced.** `ResumeWithProvenanceSchema`
   requires `source_evidence_id` per bullet, but an ID that matches nothing
   becomes `source_evidence_title: "Unknown"` (line ~809) and the bullet ships.
   The model can (and does) invent IDs.
2. **Gaps are handed to the model as writing context.** The prompt includes
   `Gaps: ${evidenceMap.gaps.join(", ")}` and instructs "Acknowledge gaps
   indirectly through what you bring" — i.e. the model is *told what's missing
   and asked to compensate*. That is the fabrication invitation.
3. **Quality check is a post-hoc LLM self-review that blocks nothing.** Failing
   `overall_passed` only sets `status: needs_review`; the fabricated document is
   still persisted and shown.
4. **No date-math gate** (grep: no years-of-experience computation anywhere).
   A 2021–2025 history sails into a "5+ years required" role.
5. **No structure gate** — nothing constrains bullets to employer/title/date
   blocks; "Additional Relevant Experience" is model-invented.
6. **No mirroring cap** — nothing measures summary overlap with the job post.

**What already exists — do NOT rebuild:**

- Requirement→evidence match report with met/partial/gap statuses:
  `lib/evidence/buildEvidenceMapForJob.ts` + `matchRequirementToEvidence.ts`
  (persisted at `jobs.evidence_map.requirement_matches`).
- Cited entailment judge: `lib/matching/entailment-judge.ts` (merged) — verdicts
  with mandatory evidence citations, honesty-guard downgrade.
- **PR #133 (open)**: `computeFitScore` + `FIT_THRESHOLD=70` server-side gate
  (409 `fit_below_threshold`), Prove Fit surface, ATS sanitizer, boilerplate
  exclusion. **This PR is the skeleton of "gap report before generation" — land
  it first (rebase onto current main; `generate-documents/route.ts` has moved).**
- Post-generation LLM quality check (`QualityCheckSchema`) — keep as advisory,
  it is not the enforcement layer.

**Audit's open questions, answered:** Xvantage / MBA / certifications /
"Additional Relevant Experience" do not need manual adjudication — under P1
below, any claim without a resolvable evidence ID is stripped mechanically,
whoever it belongs to. The "5+ years" question is answered by P3's date gate.

---

## Work packages (in order)

### P0 — Land PR #133 (prerequisite, do first)
Rebase `codex/stabilize-supabase-browser-contract` onto current main (conflicts
expected in `generate-documents/route.ts` — it gained `.nullable()` schema fixes
and a user-client fallback since the branch diverged). Re-run its unit tests +
one live generation. This delivers the fit gate + Prove Fit surface.

### P1 — Deterministic citation validator (the core fix)
New `lib/generation/citation-validator.ts`, **pure functions, no LLM**:
- Input: generated resume-with-provenance + the exact evidence records passed
  into the prompt.
- Every `experience_bullet.source_evidence_id` must resolve to a passed-in
  evidence record → else the bullet is **removed** (not flagged).
- Every competency/skill listed must intersect the union of evidenced
  `skills`/`tools_used` (case-insensitive) → else removed.
- Every bullet must attach to an employer+title+date block derived from
  evidence (kills floating sections — this is the structure gate).
- Output: `{ cleaned, removed: [{claim, reason}] }`. Removed items become the
  honest gap report shown to the user (P4), never silently dropped.
- Wire into `generate-documents` AFTER generation, BEFORE persistence. If
  removal leaves a section empty, regenerate once with the cleaned constraint
  set; if still empty, return the gap report instead of a resume.

### P2 — Gap exclusion at prompt time
- Requirements with judge/matcher status `gap` are REMOVED from the generation
  objective (not listed as "Gaps:" context). Replace the "acknowledge gaps
  indirectly" instruction with: "Address ONLY the following evidenced
  requirements. Do not reference or compensate for anything else."
- Only evidence records (with IDs) go into the context — no free-text profile
  summary unless it is itself an evidence record.

### P3 — Date-math gate
New `lib/generation/experience-math.ts`: parse `date_range` on work-experience
evidence, compute total non-overlapping dated years. If the job's parsed
years-requirement exceeds it, that requirement is a `gap` (feeds P2 exclusion +
P4 report). Never rounds up; unparseable ranges count as zero.

### P4 — Gap report as a product surface
Extend the Prove Fit page (from P0/PR #133): show requirements the user does
NOT clear, plainly, with the coach CTA ("add evidence for X") — the audit's
recommendation that the product tell the truth instead of the generator
"helping". Removed-claim output from P1 renders here too.

### P5 — Mirroring cap
`lib/generation/mirror-score.ts`: trigram overlap between generated summary and
job-post text; above threshold (start 0.35, tune against corpus) → regenerate
summary once with "do not reuse the posting's phrasing"; still above → flag in
the quality panel. Cheap, deterministic.

### P6 — Regression fixture (locks it in)
`tests/generation-integrity.test.ts` (node:test, same harness as
`real-api-e2e.test.ts`): seed a fixture profile with known evidence, run real
generation against a job whose requirements exceed the evidence, assert:
- zero bullets with unresolvable evidence IDs,
- zero competencies outside evidenced skills,
- no content outside employer/title/date blocks,
- the unmet requirement appears in the gap report,
- summary mirror score under cap.
This test FAILS on today's main (that's the point) and gates every future
generation change.

## KPI targets (from the audit)
| KPI | Baseline | Target |
|---|---|---|
| Claims carrying a resolvable evidence ID | ~30% | 100% |
| Fabricated bullets per resume | ~5 | 0 |
| Gap report shown for unmet hard requirements | 0/1 | 1/1 |
| Bullets outside employer/title/date blocks | present | 0 |
| Summary trigram overlap with posting | high | < 0.35 |

## Guardrails for the implementer
- `app/api/generate-documents/route.ts` is a **protected path** (generation
  spine) — touch is approved for this task, but keep diffs surgical.
- Validators are deterministic library code with unit tests; the LLM quality
  check stays advisory.
- Per `docs/PROOF_STANDARD.md`: every claim of "fixed" needs a live repro —
  for this task that means running the P6 fixture against pre-change code
  (fails) and post-change code (passes), and attaching one real
  generate-documents response showing the gap report.
- Do not touch `lib/actions/apply.ts`, ready-to-apply, or `lib/supabase/**`.
