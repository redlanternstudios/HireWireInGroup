export type RequirementType =
  | "years_experience"
  | "credential"
  | "tool"
  | "domain"
  | "outcome"
  | "responsibility"
  | "skill"
  | "other"

export function inferRequirementType(text: string): RequirementType {
  const value = text.toLowerCase()
  if (/(\d+\+?\s*years?|years?\s+of\s+experience|experience\s+in)/.test(value)) return "years_experience"
  if (/(bachelor|master|mba|phd|degree|certified|certification|license|pmp|cka)/.test(value)) return "credential"
  if (/(salesforce|sap|jira|figma|supabase|openai|api|tableau|excel|python|sql)/.test(value)) return "tool"
  if (/(healthcare|finance|enterprise\s+saas|construction|education|government|retail)/.test(value)) return "domain"
  if (/(increase|improve|reduce|delivered|impact|outcome|kpi|adoption|revenue|efficiency)/.test(value)) return "outcome"
  if (/(own|lead|manage|partner|coordinate|launch|roadmap|stakeholder|cross-functional)/.test(value)) return "responsibility"
  if (/(analytical|problem solving|communication|strategy|leadership|skill|ability)/.test(value)) return "skill"
  return "other"
}

export function requirementAnchorId(requirementId: string): string {
  const safeId = requirementId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `req-${safeId || "unknown"}`
}
