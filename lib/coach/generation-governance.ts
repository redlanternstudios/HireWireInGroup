import { validateAllClaims, validateClaim } from "./claim-validator"
import { scoreDrift } from "./drift-scorer"
import type {
  GovernanceEvidence,
  ClaimVerdict,
  DriftScore,
} from "./types"
import type {
  BulletProvenance,
  ParagraphProvenance,
} from "@/lib/truthserum"
import type { EvidenceRecord } from "@/lib/types"

export const GOVERNANCE_VERSION = "2026-07-11"

type ExperienceLike = {
  start_date?: string | null
  end_date?: string | null
}

type SkillVerdict = {
  skill: string
  verdict: ClaimVerdict
}

export type GovernanceReport = {
  bulletVerdicts: ClaimVerdict[]
  paragraphVerdicts: ClaimVerdict[]
  skillVerdicts: SkillVerdict[]
  drift: DriftScore
  yearsCovered: number
  requiredYears: number | null
  yearsGap: number | null
  summaryOverlap: number
  filteredSkills: string[]
  removedSkills: string[]
  gapReport: string[]
  blockedReasons: string[]
  hasFabricated: boolean
  isBlocking: boolean
  passed: boolean
  governanceVersion: string
}

export type GovernanceInput = {
  summary: string
  jobText: string
  requiredQualifications: string[]
  experience: ExperienceLike[]
  skills: string[]
  bulletProvenance: BulletProvenance[]
  paragraphProvenance: ParagraphProvenance[]
  evidenceSet: EvidenceRecord[]
}

function toGovernanceEvidence(evidenceSet: EvidenceRecord[]): GovernanceEvidence[] {
  return evidenceSet.map((evidence) => {
    const record = evidence as unknown as Record<string, unknown>
    return {
      id: evidence.id,
      source_title: evidence.source_title,
      source_type: evidence.source_type,
      confidence_level: evidence.confidence_level,
      responsibilities: Array.isArray(record.responsibilities)
        ? record.responsibilities.filter((item): item is string => typeof item === "string")
        : [],
      outcomes: Array.isArray(record.outcomes)
        ? record.outcomes.filter((item): item is string => typeof item === "string")
        : [],
      tools_used: Array.isArray(record.tools_used)
        ? record.tools_used.filter((item): item is string => typeof item === "string")
        : Array.isArray(record.systems_used)
          ? record.systems_used.filter((item): item is string => typeof item === "string")
          : [],
      team_size: typeof record.team_size === "number" ? record.team_size : null,
      budget_scope: typeof record.budget_scope === "string" ? record.budget_scope : null,
      user_impact_scale: typeof record.user_impact_scale === "string" ? record.user_impact_scale : null,
      what_not_to_overstate: typeof record.what_not_to_overstate === "string" ? record.what_not_to_overstate : null,
      approved_achievement_bullets: Array.isArray(record.approved_achievement_bullets)
        ? record.approved_achievement_bullets.filter((item): item is string => typeof item === "string")
        : [],
    }
  })
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function evidenceContainsSkill(skill: string, evidence: GovernanceEvidence): boolean {
  const target = normalizeText(skill)
  if (!target) return false

  const directFields = [
    evidence.source_title,
    ...(evidence.responsibilities ?? []),
    ...(evidence.outcomes ?? []),
    ...(evidence.approved_achievement_bullets ?? []),
    ...(evidence.tools_used ?? []),
  ]

  return directFields.some((field) => normalizeText(field).includes(target))
}

function trigrams(value: string): string[] {
  const words = normalizeText(value).split(" ").filter(Boolean)
  if (words.length <= 2) return words

  const grams: string[] = []
  for (let index = 0; index <= words.length - 3; index += 1) {
    grams.push(words.slice(index, index + 3).join(" "))
  }
  return grams
}

function trigramOverlap(left: string, right: string): number {
  const a = new Set(trigrams(left))
  const b = new Set(trigrams(right))
  if (a.size === 0 || b.size === 0) return 0

  let hits = 0
  for (const gram of a) {
    if (b.has(gram)) hits += 1
  }

  return hits / Math.min(a.size, b.size)
}

function parseDateValue(value?: string | null, endOfRange = false): Date | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (normalized === "present" || normalized === "current" || normalized === "now") {
    return new Date()
  }
  if (/^\d{4}$/.test(normalized)) {
    return new Date(`${normalized}-${endOfRange ? "12" : "01"}-${endOfRange ? "31" : "01"}T00:00:00Z`)
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function calculateYearsCovered(experience: ExperienceLike[]): number {
  if (!Array.isArray(experience) || experience.length === 0) return 0

  let totalMonths = 0
  const now = new Date()

  for (const role of experience) {
    const start = parseDateValue(role.start_date, false)
    if (!start) continue
    const end = parseDateValue(role.end_date, true) ?? now
    const months =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth())
    if (months > 0) totalMonths += months
  }

  return Math.floor(totalMonths / 12)
}

export function extractRequiredYears(jobText: string, requiredQualifications: string[]): number | null {
  const text = [jobText, ...requiredQualifications].join(" ")
  const matches = Array.from(text.matchAll(/(\d{1,2})\s*(?:\+|plus)?\s*years?/gi))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (matches.length === 0) return null
  return Math.max(...matches)
}

export function buildGovernanceReport(input: GovernanceInput): GovernanceReport {
  const evidenceSet = toGovernanceEvidence(input.evidenceSet)
  const bulletClaims = input.bulletProvenance.map((bullet) => ({
    text: bullet.bullet_text,
    cited_evidence_id: bullet.source_evidence_id,
  }))
  const paragraphClaims = input.paragraphProvenance.map((paragraph) => ({
    text: paragraph.paragraph_text,
    cited_evidence_id: paragraph.evidence_used[0] ?? null,
  }))

  const { bulletVerdicts, paragraphVerdicts, hasFabricated, fabricatedCount, lowConfidenceCount } =
    validateAllClaims(bulletClaims, paragraphClaims, evidenceSet)

  const skillVerdicts = input.skills.map((skill) => ({
    skill,
    verdict: validateClaim({ text: skill, cited_evidence_id: null }, evidenceSet),
  }))

  const filteredSkills = skillVerdicts
    .filter(({ skill }) => evidenceSet.some((evidence) => evidenceContainsSkill(skill, evidence)))
    .map(({ skill }) => skill)

  const removedSkills = skillVerdicts
    .filter(({ skill }) => !evidenceSet.some((evidence) => evidenceContainsSkill(skill, evidence)))
    .map(({ skill }) => skill)

  const drift = scoreDrift({
    bulletTexts: input.bulletProvenance.map((bullet) => ({
      text: bullet.bullet_text,
      evidence_id: bullet.source_evidence_id,
    })),
    paragraphTexts: input.paragraphProvenance.map((paragraph) => ({
      text: paragraph.paragraph_text,
      evidence_id: paragraph.evidence_used[0] ?? null,
    })),
    bulletVerdicts,
    paragraphVerdicts,
    evidenceSet,
  })

  const yearsCovered = calculateYearsCovered(input.experience)
  const requiredYears = extractRequiredYears(input.jobText, input.requiredQualifications)
  const yearsGap = requiredYears != null ? Math.max(0, requiredYears - yearsCovered) : null
  const summaryOverlap = trigramOverlap(input.summary, input.jobText)

  const gapReport: string[] = []
  if (yearsGap != null && yearsGap > 0) {
    gapReport.push(
      `Years gap: profile shows ${yearsCovered} years while the role asks for ${requiredYears}+ years.`
    )
  }
  if (summaryOverlap >= 0.35) {
    gapReport.push(
      `Summary overlap with the job post is ${Math.round(summaryOverlap * 100)}%, which is high enough to read as mirroring.`
    )
  }
  if (removedSkills.length > 0) {
    gapReport.push(`Removed unsupported competencies: ${removedSkills.join(", ")}.`)
  }
  if (hasFabricated) {
    const fabricatedClaims = [...bulletVerdicts, ...paragraphVerdicts]
      .filter((verdict) => verdict.confidence === "fabricated")
      .map((verdict) => verdict.claim_text)
    gapReport.push(`Fabricated claims blocked: ${fabricatedClaims.join(" | ")}`)
  }
  if (drift.flags.length > 0) {
    gapReport.push(drift.summary)
  }

  const blockedReasons = [
    ...bulletVerdicts.filter((verdict) => verdict.confidence === "fabricated").map(
      (verdict) => verdict.failure_reason ?? `Unsupported claim: ${verdict.claim_text}`
    ),
    ...paragraphVerdicts.filter((verdict) => verdict.confidence === "fabricated").map(
      (verdict) => verdict.failure_reason ?? `Unsupported paragraph: ${verdict.claim_text}`
    ),
    ...(drift.is_blocking ? [drift.summary] : []),
  ]

  const isBlocking = hasFabricated || drift.is_blocking
  const passed = !isBlocking

  return {
    bulletVerdicts,
    paragraphVerdicts,
    skillVerdicts,
    drift,
    yearsCovered,
    requiredYears,
    yearsGap,
    summaryOverlap,
    filteredSkills,
    removedSkills,
    gapReport,
    blockedReasons,
    hasFabricated,
    isBlocking,
    passed,
    governanceVersion: GOVERNANCE_VERSION,
  }
}
