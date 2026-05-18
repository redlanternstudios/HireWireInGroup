import type { ContextEvidenceItem, ContextSource, ContextSourceType, EvidenceType } from "./types"
import { extractMetrics, firstNonEmpty, nowIso, splitSentences, stableId, unique } from "./utils"

type ParseProfileInput = {
  userId?: string
  sourceId?: string
  sourceType: ContextSourceType
  sourceLabel: string
  rawText: string
  sourceUrl?: string | null
  parsedData?: Record<string, unknown> | null
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g
const URL_PATTERN = /https?:\/\/[^\s)]+|(?:linkedin\.com|github\.com)\/[^\s)]+/gi
const COMMON_TOOLS = [
  "Salesforce", "HubSpot", "SAP", "SAP BRIM", "Workday", "NetSuite", "Oracle",
  "Python", "SQL", "JavaScript", "TypeScript", "React", "Node", "AWS", "Azure",
  "GCP", "Tableau", "Power BI", "Looker", "Figma", "Jira", "Confluence",
  "GitHub", "Git", "Docker", "Kubernetes", "Snowflake", "Databricks",
]
const COMMON_SKILLS = [
  "PM", "AI", "CRM",
  "product management", "project management", "program management", "stakeholder management",
  "roadmap", "go-to-market", "analytics", "automation", "process improvement",
  "requirements gathering", "cross functional", "leadership", "strategy",
  "billing operations", "enterprise systems", "governance", "machine learning",
  "artificial intelligence", "prompt engineering", "customer discovery",
]

export function parseProfile(input: ParseProfileInput) {
  const createdAt = nowIso()
  const source: ContextSource = {
    id: input.sourceId ?? stableId("ctx_src", [input.userId, input.sourceType, input.sourceLabel, input.rawText.slice(0, 80)]),
    user_id: input.userId,
    source_type: input.sourceType,
    source_label: input.sourceLabel,
    source_url: input.sourceUrl ?? null,
    raw_text: input.rawText,
    parsed_at: createdAt,
    created_at: createdAt,
    trust_level: input.sourceType === "prior_generated_doc" || input.sourceType === "coach_memory" ? "low" : "high",
  }

  const evidenceItems: ContextEvidenceItem[] = []
  const add = (type: EvidenceType, rawText: string, normalizedValue = rawText, metadata: Record<string, unknown> = {}) => {
    const cleanRaw = rawText.trim()
    const cleanNormalized = normalizedValue.trim()
    if (!cleanRaw || !cleanNormalized) return
    evidenceItems.push({
      id: stableId("ctx_ev", [source.id, type, cleanRaw, cleanNormalized]),
      user_id: input.userId,
      source_id: source.id,
      evidence_type: type,
      source_type: source.source_type,
      source_label: source.source_label,
      raw_text: cleanRaw,
      normalized_value: cleanNormalized,
      confidence: metadata.confidence === "low" || metadata.confidence === "medium" ? metadata.confidence : "high",
      extraction_method: metadata.extraction_method === "existing_structured_data" ? "existing_structured_data" : "regex",
      metadata,
      created_at: createdAt,
    })
  }

  for (const email of input.rawText.match(EMAIL_PATTERN) ?? []) add("email", email)
  for (const phone of input.rawText.match(PHONE_PATTERN) ?? []) add("phone", phone)
  for (const url of input.rawText.match(URL_PATTERN) ?? []) add("link", url)

  const parsed = input.parsedData ?? {}
  addStructuredProfile(parsed, add)

  const lines = splitSentences(input.rawText)
  for (const line of lines) {
    for (const metric of extractMetrics(line)) add("metric", line, metric, { metric })
    if (looksLikeAchievement(line)) add("achievement", line)
  }

  for (const tool of COMMON_TOOLS) {
    if (new RegExp(`\\b${escapeRegExp(tool)}\\b`, "i").test(input.rawText)) add("tool", tool)
  }
  for (const skill of COMMON_SKILLS) {
    if (input.rawText.toLowerCase().includes(skill.toLowerCase())) add("skill", skill)
  }

  return { source, evidenceItems: dedupeEvidence(evidenceItems) }
}

function addStructuredProfile(
  parsed: Record<string, unknown>,
  add: (type: EvidenceType, rawText: string, normalizedValue?: string, metadata?: Record<string, unknown>) => void,
) {
  const metadata = { extraction_method: "existing_structured_data" }
  add("name", firstNonEmpty(String(parsed.full_name ?? ""), String(parsed.name ?? "")), undefined, metadata)
  add("location", String(parsed.location ?? ""), undefined, metadata)
  add("email", String(parsed.email ?? ""), undefined, metadata)
  add("phone", String(parsed.phone ?? ""), undefined, metadata)

  for (const linkKey of ["linkedin_url", "github_url", "website_url"]) {
    add("link", String(parsed[linkKey] ?? ""), undefined, { ...metadata, link_type: linkKey })
  }
  for (const skill of asStringArray(parsed.skills)) add("skill", skill, undefined, metadata)
  for (const tool of asStringArray(parsed.tools)) add("tool", tool, undefined, metadata)
  for (const domain of asStringArray(parsed.domains)) add("industry", domain, undefined, metadata)

  for (const exp of asObjectArray(parsed.work_experience).concat(asObjectArray(parsed.experience))) {
    const role = firstNonEmpty(String(exp.role ?? ""), String(exp.title ?? ""))
    const company = String(exp.company ?? "")
    const label = [role, company].filter(Boolean).join(" at ")
    add("work_experience", label, label, metadata)
    add("title", role, role, metadata)
    add("company", company, company, metadata)
    add("date", String(exp.date_range ?? ""), undefined, metadata)
    for (const item of [...asStringArray(exp.responsibilities), ...asStringArray(exp.outcomes), ...asStringArray(exp.highlights)]) {
      add(looksLikeAchievement(item) ? "achievement" : "raw_snippet", item, item, metadata)
    }
    for (const tool of asStringArray(exp.tools_used)) add("tool", tool, undefined, metadata)
  }

  for (const edu of asObjectArray(parsed.education)) {
    const degree = String(edu.degree ?? "")
    const school = String(edu.school ?? "")
    add("education", [degree, school].filter(Boolean).join(", "), undefined, metadata)
    add("degree", degree, undefined, metadata)
    add("school", school, undefined, metadata)
  }
  for (const cert of asObjectArray(parsed.certifications)) {
    add("certification", firstNonEmpty(String(cert.name ?? ""), String(cert.title ?? "")), undefined, metadata)
  }
  for (const project of asObjectArray(parsed.projects)) {
    add("project", firstNonEmpty(String(project.name ?? ""), String(project.title ?? "")), undefined, metadata)
    for (const tool of asStringArray(project.tech_stack)) add("tool", tool, undefined, metadata)
  }
}

function looksLikeAchievement(text: string) {
  return /\b(led|built|launched|delivered|improved|reduced|increased|managed|created|implemented|shipped|automated|rolled out|saved|grew)\b/i.test(text)
}

function dedupeEvidence(items: ContextEvidenceItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.evidence_type}:${item.normalized_value.toLowerCase()}:${item.raw_text.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? unique(value.map(String).map((v) => v.trim()).filter(Boolean)) : []
}

function asObjectArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item)) : []
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
