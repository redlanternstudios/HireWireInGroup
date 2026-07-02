import { z } from "zod"

const EVIDENCE_SOURCE_TYPES = [
  "work_experience",
  "project",
  "portfolio_entry",
  "shipped_product",
  "live_site",
  "achievement",
  "certification",
  "publication",
  "open_source",
  "education",
  "skill",
] as const

const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const
const EVIDENCE_WEIGHTS = ["highest", "high", "medium", "low"] as const

// POST /api/evidence (create)
export const CreateEvidenceSchema = z.object({
  source_type: z.enum(EVIDENCE_SOURCE_TYPES),
  source_title: z.string().min(1, "Title is required").max(300),
  source_url: z.string().url("Invalid URL").optional(),

  project_name: z.string().optional(),
  role_name: z.string().optional(),
  company_name: z.string().optional(),
  date_range: z.string().optional(),

  industries: z.array(z.string()).optional(),

  responsibilities: z.array(z.string()).optional(),
  tools_used: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  proof_snippet: z.string().max(1000).optional(),

  // TruthSerum fields
  user_problem: z.string().max(500).optional(),
  business_goal: z.string().max(500).optional(),
  what_shipped: z.string().max(500).optional(),
  what_visible: z.string().max(500).optional(),
  what_not_to_overstate: z.string().max(500).optional(),

  confidence_level: z.enum(CONFIDENCE_LEVELS).default("medium"),
  evidence_weight: z.enum(EVIDENCE_WEIGHTS).default("medium"),
  is_user_approved: z.boolean().default(false),
})

// PATCH /api/evidence/[id] (partial update)
export const UpdateEvidenceSchema = CreateEvidenceSchema.partial()

export type CreateEvidence = z.infer<typeof CreateEvidenceSchema>
export type UpdateEvidence = z.infer<typeof UpdateEvidenceSchema>
export type EvidenceSourceType = typeof EVIDENCE_SOURCE_TYPES[number]
