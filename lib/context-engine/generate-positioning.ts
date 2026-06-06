import type { ContextGapReport, JobRequirementModel } from "./types"

export function generatePositioning(params: {
  gapReport: ContextGapReport
  requirements: JobRequirementModel[]
}) {
  const strongest = params.gapReport.matches
    .filter((match) => ["direct_match", "terminology_mismatch"].includes(match.match_type))
    .slice(0, 3)
  const adjacent = params.gapReport.matches
    .filter((match) => ["adjacent_match", "inferred_match"].includes(match.match_type))
    .slice(0, 3)
  const gaps = params.gapReport.matches
    .filter((match) => ["true_gap", "unsupported"].includes(match.match_type))
    .slice(0, 3)

  return {
    headline: params.gapReport.score >= 75
      ? "Strong evidence-backed fit"
      : params.gapReport.score >= 50
        ? "Viable fit with careful positioning"
        : "Stretch fit with evidence gaps",
    resume_strategy: gaps.length > 0
      ? "Lead with direct evidence and avoid unsupported requirements."
      : "Use confident evidence-backed positioning.",
    cover_letter_strategy: adjacent.length > 0
      ? "Bridge adjacent experience explicitly and keep claims grounded."
      : "Reinforce the strongest direct matches.",
    interview_strategy: gaps.length > 0
      ? "Prepare honest answers for gaps and gather more evidence before applying."
      : "Prepare STAR stories for the strongest requirements.",
    strongest_requirement_ids: strongest.map((match) => match.requirement_id),
    adjacent_requirement_ids: adjacent.map((match) => match.requirement_id),
    gap_requirement_ids: gaps.map((match) => match.requirement_id),
  }
}
