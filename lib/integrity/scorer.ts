// lib/integrity/scorer.ts
// Resume Integrity Scorer: scores resume bullets for fabrication risk, flags, and suggests rewrites

import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const ResumeBulletIntegritySchema = z.object({
  bullet: z.string(),
  risk_score: z.number().min(0).max(1),
  risk_level: z.enum(["low", "medium", "high"]),
  flag_reason: z.string().nullable(),
  suggested_rewrite: z.string().nullable(),
})

const ResumeBulletIntegrityResultsSchema = z.object({
  results: z.array(ResumeBulletIntegritySchema),
})

const RESUME_BULLET_INTEGRITY_RESULTS_SCHEMA_DESCRIPTION = `{
  "results": Array<{
    "bullet": string,
    "risk_score": number,
    "risk_level": "low" | "medium" | "high",
    "flag_reason": string | null,
    "suggested_rewrite": string | null
  }>
}`

export async function scoreResumeBullets(bullets: string[]): Promise<z.infer<typeof ResumeBulletIntegritySchema>[]> {
  const prompt = `You are a resume integrity scorer. For each bullet, return a risk score (0-1), risk level (low/medium/high), and a flag reason if any claim is implausible, unverifiable, or AI-inflated. Suggest a rewrite if needed. Return an object with a results array.`
  const result = await generateStructuredText({
    model: CLAUDE_MODELS.SONNET,
    schema: ResumeBulletIntegrityResultsSchema,
    schemaDescription: RESUME_BULLET_INTEGRITY_RESULTS_SCHEMA_DESCRIPTION,
    prompt: `${prompt}\n\n${JSON.stringify(bullets)}`,
  })
  return result.results ?? []
}
