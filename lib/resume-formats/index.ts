export const RESUME_FORMAT_IDS = [
  "ats_safe",
  "modern_professional",
  "compact_professional",
  "executive_narrative",
  "clean_minimal",
] as const

export const RESUME_FONT_IDS = [
  "inter",
  "calibri",
  "arial",
  "helvetica",
  "georgia",
] as const

export type ResumeFormatId = (typeof RESUME_FORMAT_IDS)[number]
export type ResumeFontId = (typeof RESUME_FONT_IDS)[number]

export type ResumeFormatConfig = {
  id: ResumeFormatId
  label: string
  defaultFont: ResumeFontId
  description: string
  bestFor: string[]
  spacing: {
    fontSize: number
    lineGap: number
    sectionGap: number
  }
  atsRisk: "lowest" | "low" | "moderate"
}

export type ResumeFormatRecommendationInput = {
  roleTitle?: string | null
  industry?: string | null
  seniority?: string | null
  applicationChannel?: string | null
  resumeText?: string | null
}

export const RESUME_FORMATS: Record<ResumeFormatId, ResumeFormatConfig> = {
  ats_safe: {
    id: "ats_safe",
    label: "ATS Safe",
    defaultFont: "calibri",
    description: "Best for strict ATS systems and high-volume applications.",
    bestFor: ["LinkedIn", "Indeed", "Workday", "Greenhouse", "Lever"],
    spacing: { fontSize: 22, lineGap: 80, sectionGap: 180 },
    atsRisk: "lowest",
  },
  modern_professional: {
    id: "modern_professional",
    label: "Modern Professional",
    defaultFont: "inter",
    description: "Best balance of polish and parser safety.",
    bestFor: ["Product", "Tech", "Sales", "Operations", "Project management", "Customer success"],
    spacing: { fontSize: 22, lineGap: 100, sectionGap: 220 },
    atsRisk: "low",
  },
  compact_professional: {
    id: "compact_professional",
    label: "Compact Professional",
    defaultFont: "arial",
    description: "Best for dense experience while staying single-column.",
    bestFor: ["Experienced candidates", "Technical roles", "Long resumes"],
    spacing: { fontSize: 20, lineGap: 40, sectionGap: 120 },
    atsRisk: "low",
  },
  executive_narrative: {
    id: "executive_narrative",
    label: "Executive Narrative",
    defaultFont: "georgia",
    description: "Best for senior positioning with outcome-first emphasis.",
    bestFor: ["Managers", "Directors", "Founders", "Consultants", "Strategy roles"],
    spacing: { fontSize: 22, lineGap: 140, sectionGap: 260 },
    atsRisk: "moderate",
  },
  clean_minimal: {
    id: "clean_minimal",
    label: "Clean Minimal",
    defaultFont: "helvetica",
    description: "Best for conservative industries and high-trust contexts.",
    bestFor: ["Finance", "Healthcare", "Government", "Education", "Legal", "Administration"],
    spacing: { fontSize: 22, lineGap: 80, sectionGap: 180 },
    atsRisk: "lowest",
  },
}

export const RESUME_FONTS: Record<ResumeFontId, { label: string; docxName: string }> = {
  inter: { label: "Inter", docxName: "Inter" },
  calibri: { label: "Calibri", docxName: "Calibri" },
  arial: { label: "Arial", docxName: "Arial" },
  helvetica: { label: "Helvetica", docxName: "Helvetica" },
  georgia: { label: "Georgia", docxName: "Georgia" },
}

export function normalizeResumeFormat(value: unknown): ResumeFormatId {
  return RESUME_FORMAT_IDS.includes(value as ResumeFormatId)
    ? value as ResumeFormatId
    : "modern_professional"
}

export function normalizeResumeFont(value: unknown, format: ResumeFormatId): ResumeFontId {
  return RESUME_FONT_IDS.includes(value as ResumeFontId)
    ? value as ResumeFontId
    : RESUME_FORMATS[format].defaultFont
}

export function recommendResumeFormat(input: ResumeFormatRecommendationInput): {
  format: ResumeFormatId
  font: ResumeFontId
  reason: string
} {
  const role = `${input.roleTitle ?? ""} ${input.seniority ?? ""}`.toLowerCase()
  const industry = (input.industry ?? "").toLowerCase()
  const channel = (input.applicationChannel ?? "").toLowerCase()
  const resumeLineCount = (input.resumeText ?? "").split(/\r?\n/).filter(Boolean).length

  const strictAts = ["workday", "greenhouse", "lever", "indeed", "linkedin", "ats"].some(token =>
    channel.includes(token)
  )
  if (strictAts) {
    return {
      format: "ats_safe",
      font: RESUME_FORMATS.ats_safe.defaultFont,
      reason: "Recommended because this application channel is likely to use strict resume parsing.",
    }
  }

  if (["finance", "healthcare", "government", "education", "legal", "administration"].some(token =>
    industry.includes(token) || role.includes(token)
  )) {
    return {
      format: "clean_minimal",
      font: RESUME_FORMATS.clean_minimal.defaultFont,
      reason: "Recommended because this role or industry benefits from a conservative, high-trust format.",
    }
  }

  if (["director", "executive", "founder", "vp", "vice president", "head of", "chief", "consultant", "strategy"].some(token =>
    role.includes(token)
  )) {
    return {
      format: "executive_narrative",
      font: RESUME_FORMATS.executive_narrative.defaultFont,
      reason: "Recommended because senior roles benefit from more whitespace and outcome-first positioning.",
    }
  }

  if (resumeLineCount > 70 || ["senior", "principal", "staff", "architect"].some(token => role.includes(token))) {
    return {
      format: "compact_professional",
      font: RESUME_FORMATS.compact_professional.defaultFont,
      reason: "Recommended because this resume needs a denser format without adding columns or parser risk.",
    }
  }

  return {
    format: "modern_professional",
    font: RESUME_FORMATS.modern_professional.defaultFont,
    reason: "Recommended as the best everyday balance of polish, readability, and parser safety.",
  }
}

export function getFormatSafetyWarning(format: ResumeFormatId, applicationChannel?: string | null): string | null {
  const channel = (applicationChannel ?? "").toLowerCase()
  const strictAts = ["workday", "greenhouse", "lever", "indeed", "linkedin", "ats"].some(token =>
    channel.includes(token)
  )

  if (strictAts && format !== "ats_safe") {
    return "This format may reduce parser safety for this role. Use ATS Safe instead."
  }

  if (RESUME_FORMATS[format].atsRisk === "moderate") {
    return "This format is still single-column, but ATS Safe is safer for strict parsing."
  }

  return null
}
