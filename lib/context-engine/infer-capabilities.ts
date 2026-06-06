import type { AllowedUsage, CapabilityType, ContextCapability, ContextEvidenceItem, ContextNormalizedEntity, RiskLevel } from "./types"
import { includesAny, nowIso, stableId, unique } from "./utils"

type CapabilityRule = {
  name: string
  type: CapabilityType
  terms: string[]
  reasoning: string
}

const RULES: CapabilityRule[] = [
  {
    name: "enterprise systems",
    type: "technical",
    terms: ["sap", "oracle", "workday", "netsuite", "salesforce", "erp", "crm"],
    reasoning: "Evidence references enterprise platforms or systems of record.",
  },
  {
    name: "global rollout",
    type: "execution",
    terms: ["countries", "global", "international", "markets", "regions", "rollout", "rolled out"],
    reasoning: "Evidence references multi-market or global delivery.",
  },
  {
    name: "stakeholder management",
    type: "communication",
    terms: ["stakeholder", "cross functional", "executive", "partner", "alignment"],
    reasoning: "Evidence references cross-functional or stakeholder-facing work.",
  },
  {
    name: "billing operations",
    type: "operations",
    terms: ["billing", "invoicing", "brim", "revenue", "quote to cash", "payments"],
    reasoning: "Evidence references billing, invoicing, revenue, or quote-to-cash operations.",
  },
  {
    name: "process automation",
    type: "operations",
    terms: ["automation", "automated", "workflow", "reduced manual", "process improvement"],
    reasoning: "Evidence references process automation or workflow improvement.",
  },
  {
    name: "AI product judgment",
    type: "product",
    terms: ["ai product", "machine learning", "ml", "prompt", "model", "ai governance"],
    reasoning: "Evidence references AI/ML product, prompt, model, or governance work.",
  },
]

export function inferCapabilities(
  evidenceItems: ContextEvidenceItem[],
  entities: ContextNormalizedEntity[],
): ContextCapability[] {
  const createdAt = nowIso()
  const allTextByEvidence = evidenceItems.map((item) => ({
    id: item.id,
    text: `${item.raw_text} ${item.normalized_value}`,
    sourceType: item.source_type,
  }))
  const entityText = entities.map((entity) => entity.canonical_name).join(" ")

  return RULES.flatMap((rule) => {
    const evidenceIds = unique(allTextByEvidence
      .filter((item) => includesAny(`${item.text} ${entityText}`, rule.terms))
      .map((item) => item.id))
    if (evidenceIds.length === 0) return []
    const hasLowTrust = allTextByEvidence.some((item) =>
      evidenceIds.includes(item.id) &&
      (item.sourceType === "prior_generated_doc" || item.sourceType === "coach_memory")
    )
    const riskLevel: RiskLevel = hasLowTrust ? "medium" : "low"
    const allowedUsage: AllowedUsage = hasLowTrust ? "interview_only" : "resume_allowed_with_reframe"
    return [{
      id: stableId("ctx_cap", [rule.name, evidenceIds.join(",")]),
      user_id: evidenceItems[0]?.user_id,
      capability_name: rule.name,
      capability_type: rule.type,
      inferred_from_evidence_ids: evidenceIds,
      reasoning_summary: rule.reasoning,
      confidence: evidenceIds.length >= 2 ? "high" : "medium",
      risk_level: riskLevel,
      allowed_usage: allowedUsage,
      created_at: createdAt,
    }]
  })
}
