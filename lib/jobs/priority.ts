/**
 * Priority Scoring
 *
 * Simple priority bands based on fit score, recency, and staleness.
 * UI organization only — does not affect readiness or job status.
 */

export type PriorityBand = "high" | "medium" | "low" | "archive_candidate" | "unknown"

export const PRIORITY_LABEL: Record<PriorityBand, string> = {
  high:              "High Priority",
  medium:            "Medium Priority",
  low:               "Low Priority",
  archive_candidate: "Archive Candidate",
  unknown:           "Not Scored",
}

export const PRIORITY_COLOR: Record<PriorityBand, string> = {
  high:              "text-emerald-700 bg-emerald-50",
  medium:            "text-amber-700 bg-amber-50",
  low:               "text-stone-500 bg-stone-100",
  archive_candidate: "text-rose-500 bg-rose-50",
  unknown:           "text-muted-foreground bg-muted",
}

export const PRIORITY_DOT: Record<PriorityBand, string> = {
  high:              "bg-emerald-500",
  medium:            "bg-amber-400",
  low:               "bg-stone-300",
  archive_candidate: "bg-rose-400",
  unknown:           "bg-muted-foreground/30",
}

export function derivePriority(job: {
  score?: number | null
  status?: string | null
  applied_at?: string | null
}, isArchiveCandidate: boolean): PriorityBand {
  const status = job.status ?? ""

  // Closed / archived are always archive candidate or low
  if (["archived", "offered", "rejected"].includes(status)) return "archive_candidate"
  if (isArchiveCandidate) return "archive_candidate"

  // Applied jobs: still worth tracking
  if (status === "applied" || !!job.applied_at) return "medium"

  const score = job.score ?? null

  if (score === null) return "unknown"
  if (score >= 75) return "high"
  if (score >= 50) return "medium"
  return "low"
}

/**
 * Numeric sort weight for "Needs Action First" / "Closest to Ready"
 * Lower = more urgent
 */
export const PRIORITY_SORT_WEIGHT: Record<PriorityBand, number> = {
  high:              1,
  medium:            2,
  unknown:           3,
  low:               4,
  archive_candidate: 5,
}
