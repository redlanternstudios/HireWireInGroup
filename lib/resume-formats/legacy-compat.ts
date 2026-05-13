import type { ResumeFormatId } from "."

// Compatibility only. Do not use this map to revive decorative templates in
// readiness-gated export paths. Each legacy style must be reviewed before any
// future migration into a controlled Resume Format.
export const LEGACY_TEMPLATE_TO_SAFE_FORMAT: Record<string, ResumeFormatId> = {
  "tech-engineer": "modern_professional",
  "tech-lead": "executive_narrative",
  "finance-analyst": "clean_minimal",
  "finance-director": "executive_narrative",
  "health-clinical": "clean_minimal",
  "health-admin": "clean_minimal",
  "creative-ic": "modern_professional",
  "creative-lead": "executive_narrative",
  "legal-associate": "clean_minimal",
  "legal-partner": "executive_narrative",
  "edu-teacher": "clean_minimal",
  "edu-admin": "clean_minimal",
}

export function mapLegacyTemplateToSafeFormat(templateId: string | null | undefined): ResumeFormatId {
  if (!templateId) return "modern_professional"
  return LEGACY_TEMPLATE_TO_SAFE_FORMAT[templateId] ?? "modern_professional"
}
