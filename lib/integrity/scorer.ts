// lib/integrity/scorer.ts
// Resume Integrity Scorer: scores resume bullets for fabrication risk, flags, and suggests rewrites

import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const ResumeBulletIntegritySchema = z.object({
  bullet: z.string(),
  risk_score: z.number().min(0).max(1),
  risk_level: z.enum(["low", "medium", "high"]),
  flag_reason: z.string().optional(),
  suggested_rewrite: z.string().optional(),
})

export async function scoreResumeBullets(bullets: string[]): Promise<z.infer<typeof ResumeBulletIntegritySchema>[]> {
  return generateStructuredText(
    {
      model: CLAUDE_MODELS.SONNET,
      schema: z.array(ResumeBulletIntegritySchema),
      schemaDescription: `Array of: { "bullet": string, "risk_score": number 0-1, "risk_level": "low"|"medium"|"high", "flag_reason": string, "suggested_rewrite": string }`,
      contextPrompt: `You are a resume integrity scorer. For each bullet, return a risk score (0-1), risk level (low/medium/high), and a flag reason if any claim is implausible, unverifiable, or AI-inflated. Suggest a rewrite if needed. Respond as JSON array.\n\n${JSON.stringify(bullets)}`,
    },
    { route: "score-resume-bullets" }
  ) as Promise<z.infer<typeof ResumeBulletIntegritySchema>[]>
}
