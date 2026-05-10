// Coach constants for truth states, claim types, intents, artifact types, and quality gates

export const TRUTH_STATES = [
  "VERIFIED",
  "USER_CONFIRMED",
  "DERIVED",
  "UNSUPPORTED"
] as const

export const CLAIM_TYPES = [
  "EXPERIENCE",
  "EDUCATION",
  "SKILL",
  "CERTIFICATION",
  "ACHIEVEMENT",
  "PROJECT",
  "SUMMARY",
  "TITLE",
  "EMPLOYER",
  "METRIC",
  "CUSTOM"
] as const

export const GENERATION_INTENTS = [
  "ATS_OPTIMIZED",
  "MORE_CONCISE",
  "MORE_EXECUTIVE",
  "MORE_TECHNICAL",
  "MORE_LEADERSHIP",
  "MORE_RECRUITER_READABLE",
  "MORE_HIRING_MANAGER_READABLE",
  "MORE_METRICS_FOCUSED",
  "SECTION_REWRITE",
  "FULL_REWRITE"
] as const

export const ARTIFACT_TYPES = [
  "RESUME",
  "COVER_LETTER",
  "OUTREACH",
  "INTERVIEW_PREP"
] as const

export const QUALITY_HARD_FAILS = [
  "unsupported claim",
  "fabricated metric",
  "fabricated title",
  "fabricated employer",
  "fabricated certification",
  "changed chronology",
  "missing required structure",
  "generation attempted before job analysis exists"
] as const

export const QUALITY_WARNINGS = [
  "derived claim",
  "keyword saturation too high",
  "resume too long",
  "weak evidence coverage",
  "generic phrasing",
  "low recruiter scanability",
  "high drift score"
] as const
