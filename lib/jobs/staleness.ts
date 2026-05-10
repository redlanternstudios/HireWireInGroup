/**
 * Staleness Detection
 *
 * Derives staleness from existing timestamps only.
 * Does not mutate job state. UI organization only.
 * If timestamps are missing, returns not stale (safe fallback).
 */

export type StalenessLevel = "fresh" | "stale" | "very_stale" | "archive_candidate"

export interface StalenessResult {
  level: StalenessLevel
  isStale: boolean
  label: string | null
  daysSinceUpdate: number | null
}

const DAY_MS = 86_400_000

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / DAY_MS)
}

export function evaluateStaleness(job: {
  status: string | null
  updated_at?: string | null
  created_at?: string | null
  applied_at?: string | null
  generated_resume?: string | null
  generated_cover_letter?: string | null
  quality_passed?: boolean | null
}): StalenessResult {
  const status = job.status ?? ""

  // Closed statuses are never "stale" — they are just closed
  if (["archived", "offered", "rejected"].includes(status)) {
    return { level: "fresh", isStale: false, label: null, daysSinceUpdate: null }
  }

  // Use updated_at first, fall back to created_at
  const referenceDate = job.updated_at || job.created_at
  const days = daysSince(referenceDate)

  if (days === null) {
    // TODO: add updated_at to jobs table if not present; returning not stale as safe fallback
    return { level: "fresh", isStale: false, label: null, daysSinceUpdate: null }
  }

  // Archive candidate: inactive for 21+ days
  if (days >= 21) {
    return {
      level: "archive_candidate",
      isStale: true,
      label: "Archive recommended",
      daysSinceUpdate: days,
    }
  }

  // Applied but no follow-up after 7 days
  if (status === "applied" && job.applied_at) {
    const appliedDays = daysSince(job.applied_at)
    if (appliedDays !== null && appliedDays >= 7) {
      return {
        level: "stale",
        isStale: true,
        label: "Follow up due",
        daysSinceUpdate: days,
      }
    }
  }

  // Ready to apply but not applied for 2+ days
  if (job.generated_resume && job.generated_cover_letter && job.quality_passed && days >= 2) {
    return {
      level: "stale",
      isStale: true,
      label: "Needs attention",
      daysSinceUpdate: days,
    }
  }

  // Package drafted but not reviewed for 3+ days
  if ((job.generated_resume || job.generated_cover_letter) && !job.quality_passed && days >= 3) {
    return {
      level: "stale",
      isStale: true,
      label: "Needs attention",
      daysSinceUpdate: days,
    }
  }

  // Analyzed but no action for 7+ days
  if (["analyzed", "generating"].includes(status) && days >= 7) {
    return {
      level: "stale",
      isStale: true,
      label: "Stale",
      daysSinceUpdate: days,
    }
  }

  // Very stale: 14+ days with no terminal state
  if (days >= 14) {
    return {
      level: "very_stale",
      isStale: true,
      label: "Probably expired",
      daysSinceUpdate: days,
    }
  }

  return { level: "fresh", isStale: false, label: null, daysSinceUpdate: days }
}
