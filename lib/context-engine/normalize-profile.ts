import type { ContextEvidenceItem, ContextNormalizedEntity, EvidenceType, NormalizedCategory } from "./types"
import { canonicalize, confidenceFromScore, nowIso, stableId, unique } from "./utils"

const ALIASES: Record<string, { canonical: string; category: NormalizedCategory; ambiguous?: string[] }> = {
  pm: {
    canonical: "PM",
    category: "role",
    ambiguous: ["Product Manager", "Project Manager", "Program Manager", "Preventive Maintenance"],
  },
  ai: {
    canonical: "artificial intelligence",
    category: "domain",
    ambiguous: ["AI product", "AI automation", "ML systems", "prompt engineering", "AI governance"],
  },
  ml: { canonical: "machine learning", category: "domain" },
  crm: {
    canonical: "customer relationship management",
    category: "tool",
    ambiguous: ["Salesforce", "HubSpot", "lead management", "sales operations"],
  },
  "sap brim": { canonical: "SAP BRIM", category: "tool" },
  salesforce: { canonical: "Salesforce", category: "tool" },
  hubspot: { canonical: "HubSpot", category: "tool" },
  jira: { canonical: "Jira", category: "tool" },
  github: { canonical: "GitHub", category: "tool" },
  sql: { canonical: "SQL", category: "skill" },
}

export function normalizeProfile(evidenceItems: ContextEvidenceItem[]): ContextNormalizedEntity[] {
  const groups = new Map<string, ContextEvidenceItem[]>()
  for (const item of evidenceItems) {
    const key = normalizationKey(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  const createdAt = nowIso()
  return Array.from(groups.entries()).map(([key, items]) => {
    const alias = ALIASES[key]
    const rawNames = unique(items.map((item) => item.normalized_value).filter(Boolean))
    const canonicalName = alias?.canonical ?? chooseCanonicalName(rawNames)
    const category = alias?.category ?? categoryFor(items[0].evidence_type)
    const ambiguityFlags = alias?.ambiguous ? [`ambiguous:${alias.ambiguous.join("|")}`] : []
    const confidence = confidenceFromScore(items.filter((item) => item.confidence === "high").length / Math.max(items.length, 1))
    return {
      id: stableId("ctx_ent", [category, canonicalName, items.map((item) => item.id).join(",")]),
      user_id: items[0].user_id,
      entity_type: items[0].evidence_type,
      canonical_name: canonicalName,
      aliases: unique([...rawNames, ...(alias?.ambiguous ?? [])]).filter((name) => name !== canonicalName),
      category,
      confidence,
      ambiguity_flags: ambiguityFlags,
      evidence_ids: items.map((item) => item.id),
      created_at: createdAt,
    }
  })
}

function normalizationKey(item: ContextEvidenceItem) {
  const value = canonicalize(item.normalized_value)
  return ALIASES[value] ? value : value
}

function chooseCanonicalName(values: string[]) {
  const value = values.find(Boolean) ?? "unknown"
  if (value.length <= 4 && value === value.toUpperCase()) return value
  return value
    .split(/\s+/)
    .map((part) => part.length <= 3 && part === part.toUpperCase() ? part : part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

function categoryFor(type: EvidenceType): NormalizedCategory {
  if (type === "tool") return "tool"
  if (type === "skill") return "skill"
  if (type === "industry") return "domain"
  if (type === "degree" || type === "school" || type === "education") return "education"
  if (type === "certification") return "certification"
  if (type === "metric") return "metric"
  if (type === "achievement") return "achievement"
  if (type === "company") return "company"
  if (type === "title") return "role"
  return "other"
}
