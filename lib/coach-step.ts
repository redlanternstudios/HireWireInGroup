export type CoachStepStatus = "not_required" | "required" | "completed" | "skipped"

export type CoachStepState = {
  status: CoachStepStatus
  required: boolean
  complete: boolean
  skipped: boolean
  lowFit: boolean
  score: number | null
  strategicFit: number | null
  evidenceCoverage: number | null
  gaps: string[]
  addressedGaps: string[]
  remainingGaps: string[]
  nextGap: string | null
  warning: string | null
}

export type CoachStepJob = {
  score?: number | null
  score_gaps?: string[] | null
  evidence_map?: unknown
  gap_clarifications?: unknown
  gaps_addressed?: string[] | null
}

const LOW_FIT_THRESHOLD = 70

export const COACH_STEP_META_KEY = "_coach_step"

export const EVIDENCE_MAP_METADATA_KEYS = new Set([
  "matching_complete",
  "completed_at",
  "bullet_provenance",
  "paragraph_provenance",
  "selected_evidence_ids",
  "blocked_evidence",
  "mapped_items",
  "score_gaps",
  "gaps_acknowledged",
  COACH_STEP_META_KEY,
])

export function isEvidenceMapMetadataKey(key: string) {
  return key.startsWith("_") || EVIDENCE_MAP_METADATA_KEYS.has(key)
}

export function cleanGapLabel(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
}

export function getCoachStepState(job: CoachStepJob): CoachStepState {
  const score = typeof job.score === "number" && Number.isFinite(job.score) ? job.score : null
  const strategicFit = score
  const lowFit = score !== null && score < LOW_FIT_THRESHOLD
  const gaps = Array.isArray(job.score_gaps)
    ? Array.from(new Set(job.score_gaps.map(cleanGapLabel).filter(Boolean)))
    : []

  const evidenceMap = asRecord(job.evidence_map) ?? {}
  const requirementMatches = Array.isArray(evidenceMap.requirement_matches)
    ? (evidenceMap.requirement_matches as Array<Record<string, unknown>>)
    : []
  const unresolvedRequiredFromMap = requirementMatches
    .filter(
      (match) =>
        match.priority === "required" &&
        match.proof_decision === "needs_judgment" &&
        match.status !== "met",
    )
    .map((match) => cleanGapLabel(String(match.requirement_text ?? "")))
    .filter(Boolean)
  const mergedGaps = Array.from(new Set([...gaps, ...unresolvedRequiredFromMap]))
  const meta = asRecord(evidenceMap[COACH_STEP_META_KEY])
  const persistedStatus =
    meta?.status === "completed" || meta?.status === "skipped" || meta?.status === "required"
      ? meta.status
      : null

  const addressedFromColumn = Array.isArray(job.gaps_addressed)
    ? job.gaps_addressed.map(cleanGapLabel)
    : []
  const addressedFromClarifications = Array.isArray(job.gap_clarifications)
    ? job.gap_clarifications
        .map((item) => (asRecord(item)?.gap_requirement ? String(asRecord(item)?.gap_requirement) : ""))
        .map(cleanGapLabel)
    : []
  const addressedFromMap = mergedGaps.filter((gap) => {
    const entry = asRecord(evidenceMap[gap]) ?? asRecord(evidenceMap[`Gap: ${gap}`])
    return !!entry?.coach_answer || !!entry?.answered_at
  })
  const addressedGaps = Array.from(new Set([
    ...addressedFromColumn,
    ...addressedFromClarifications,
    ...addressedFromMap,
  ].filter(Boolean)))

  const required = lowFit || mergedGaps.length > 0
  const remainingGaps = mergedGaps.filter((gap) => !addressedGaps.includes(gap))
  const answeredAllCriticalGaps = mergedGaps.length > 0 && remainingGaps.length === 0
  const skipped = persistedStatus === "skipped"
  const complete = !required || skipped || persistedStatus === "completed" || answeredAllCriticalGaps
  const status: CoachStepStatus = !required
    ? "not_required"
    : skipped
      ? "skipped"
      : complete
        ? "completed"
        : "required"

  return {
    status,
    required,
    complete,
    skipped,
    lowFit,
    score,
    strategicFit,
    evidenceCoverage: getEvidenceCoverage(evidenceMap, gaps.length),
    gaps,
    addressedGaps,
    remainingGaps,
    nextGap: remainingGaps[0] ?? mergedGaps[0] ?? null,
    warning: skipped && remainingGaps.length > 0
      ? "Coach was skipped while gaps remain, so generated materials must stay conservative."
      : null,
  }
}

export function withCoachStepMeta(
  evidenceMap: unknown,
  status: Exclude<CoachStepStatus, "not_required">,
  extra: Record<string, unknown> = {},
) {
  const existingMap = asRecord(evidenceMap) ?? {}
  return {
    ...existingMap,
    [COACH_STEP_META_KEY]: {
      ...(asRecord(existingMap[COACH_STEP_META_KEY]) ?? {}),
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    },
  }
}

function getEvidenceCoverage(evidenceMap: Record<string, unknown>, gapCount: number) {
  const explicit = evidenceMap.requirement_coverage
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit

  const mappedItems = evidenceMap.mapped_items
  if (Array.isArray(mappedItems) && mappedItems.length + gapCount > 0) {
    return Math.round((mappedItems.length / (mappedItems.length + gapCount)) * 100)
  }

  const requirementKeys = Object.keys(evidenceMap).filter((key) => !isEvidenceMapMetadataKey(key))
  if (requirementKeys.length + gapCount > 0) {
    return Math.round((requirementKeys.length / (requirementKeys.length + gapCount)) * 100)
  }

  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}
