import type { ContextJobModel, ContextSource, JobRequirementModel, RequirementCategory, RequirementImportance } from "./types"
import { nowIso, splitSentences, stableId } from "./utils"

type ReverseEngineerJobInput = {
  jobId?: string
  jobText: string
  title?: string | null
  company?: string | null
  requirements?: string[]
  responsibilities?: string[]
  keywords?: string[]
}

const HARD_TERMS = ["required", "must", "minimum", "need", "proven", "years", "experience with"]
const SOFT_TERMS = ["preferred", "nice to have", "bonus", "familiarity", "comfortable", "ability to"]
const KNOCKOUT_TERMS = ["certification required", "clearance", "must be authorized", "license required", "degree required"]
const SENIORITY_TERMS = ["senior", "lead", "principal", "director", "head of", "manager"]

export function reverseEngineerJob(input: ReverseEngineerJobInput): ContextJobModel {
  const createdAt = nowIso()
  const source: ContextSource = {
    id: stableId("ctx_job_src", [input.jobId, input.title, input.company, input.jobText.slice(0, 80)]),
    source_type: "job_post",
    source_label: [input.title, input.company].filter(Boolean).join(" at ") || "Job post",
    raw_text: input.jobText,
    parsed_at: createdAt,
    created_at: createdAt,
    trust_level: "high",
  }

  const rawRequirements = [
    ...(input.requirements ?? []),
    ...(input.responsibilities ?? []),
    ...splitSentences(input.jobText).filter((line) => looksLikeRequirement(line)),
    ...(input.keywords ?? []).map((keyword) => `Keyword: ${keyword}`),
  ]

  const uniqueRequirements = Array.from(new Set(rawRequirements.map((r) => r.trim()).filter((r) => r.length > 2)))
  const requirements: JobRequirementModel[] = uniqueRequirements.map((text, index) => {
    const category = categoryFor(text)
    return {
      id: stableId("ctx_req", [input.jobId, index, text]),
      job_id: input.jobId,
      requirement_text: text,
      normalized_requirement: normalizeRequirement(text),
      category,
      importance: importanceFor(text, category),
      confidence: text.startsWith("Keyword:") ? "medium" : "high",
      evidence_from_job_post: text,
      created_at: createdAt,
    }
  })

  return {
    source,
    requirements,
    graph: {
      nodes: [
        { id: source.id, type: "source", label: source.source_label },
        ...requirements.map((requirement) => ({
          id: requirement.id,
          type: "requirement" as const,
          label: requirement.normalized_requirement,
          metadata: { importance: requirement.importance, category: requirement.category },
        })),
      ],
      edges: requirements.map((requirement) => ({
        from: requirement.id,
        to: source.id,
        relationship: "extracted_from" as const,
        confidence: requirement.confidence,
      })),
    },
  }
}

function looksLikeRequirement(text: string) {
  return /\b(required|preferred|experience|knowledge|skills?|ability|responsible|own|lead|build|manage|develop|deliver|familiarity)\b/i.test(text)
}

function categoryFor(text: string): RequirementCategory {
  const lower = text.toLowerCase()
  if (KNOCKOUT_TERMS.some((term) => lower.includes(term))) return "knockout"
  if (/keyword:/i.test(text)) return "keyword"
  if (SENIORITY_TERMS.some((term) => lower.includes(term))) return "seniority"
  if (/\b(python|sql|typescript|react|aws|azure|salesforce|hubspot|sap|jira|figma|tableau|power bi|github)\b/i.test(text)) return "tool"
  if (SOFT_TERMS.some((term) => lower.includes(term))) return "soft_requirement"
  if (HARD_TERMS.some((term) => lower.includes(term))) return "hard_requirement"
  return "negotiable"
}

function importanceFor(text: string, category: RequirementCategory): RequirementImportance {
  if (category === "knockout") return "critical"
  if (category === "hard_requirement") return "high"
  if (category === "seniority") return "high"
  if (/required|must|minimum/i.test(text)) return "critical"
  if (category === "soft_requirement" || category === "keyword") return "medium"
  return "low"
}

function normalizeRequirement(text: string) {
  return text
    .replace(/^Keyword:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
}
