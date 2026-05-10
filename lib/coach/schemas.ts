// Zod schemas for Coach types
import { z } from "zod"
import { TRUTH_STATES, CLAIM_TYPES, GENERATION_INTENTS, ARTIFACT_TYPES } from "./constants"

export const TruthStateSchema = z.enum(TRUTH_STATES)
export const ClaimTypeSchema = z.enum(CLAIM_TYPES)
export const GenerationIntentSchema = z.enum(GENERATION_INTENTS)
export const ArtifactTypeSchema = z.enum(ARTIFACT_TYPES)

export const ClaimSchema = z.object({
  claim_id: z.string(),
  type: ClaimTypeSchema,
  text: z.string(),
  evidence_ids: z.array(z.string()),
  truth_state: TruthStateSchema,
  confidence: z.number().min(0).max(1),
  skills: z.array(z.string()),
  job_requirements_matched: z.array(z.string()),
  source: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const EvidenceItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  source_type: z.string(),
  source_id: z.string(),
  title: z.string(),
  content: z.string(),
  skills: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  created_at: z.string(),
})

export const JobRequirementSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  requirement_text: z.string(),
  requirement_type: z.string(),
  priority: z.number(),
  keywords: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  created_at: z.string(),
})
