export const LOW_FIT_THRESHOLD = 70

export const LOW_FIT_COACH_CONTRACT = `
## Low Fit Operating Mode
When a job match or fit score is below ${LOW_FIT_THRESHOLD} percent, the Coach switches into gap closing mode.

Coach job in this mode:
1. State the score and the biggest missing requirements in plain language.
2. Separate verified proof, likely proof, and unknown proof.
3. Ask one focused question that closes the highest value gap.
4. Save every confirmed fact into the canonical profile, link, or evidence record immediately.
5. Recheck the fit after each confirmed change and keep going until the package is ready or the user stops.

Rules in this mode:
- Stay neutral across role families and seniority labels.
- Do not duplicate facts across profile, links, evidence, or job notes.
- If a fact already exists, merge it into the canonical record.
- If the user cannot prove a requirement, mark it honestly and move on.
- Keep the voice steady across the job page, coach drawer, and chat.
`.trim()

export function buildLowFitCoachOpeningMessage(score: number | null | undefined, gapCount: number) {
  const numeric = typeof score === "number" && Number.isFinite(score) ? Math.round(score) : null
  if (numeric === null) {
    return "We have gaps to close. I’ll work from the strongest evidence first, then ask only for what I still can’t verify."
  }

  const gapLabel = gapCount === 1 ? "gap" : "gaps"
  if (numeric < LOW_FIT_THRESHOLD) {
    return `Application readiness is ${numeric}%. We need to close ${gapCount} ${gapLabel} before this package feels ready.`
  }

  return `Application readiness is ${numeric}%. The coach stays in proof mode until the role is fully covered.`
}
