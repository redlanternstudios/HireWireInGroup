// lib/integrity/scorer.ts
// Resume Integrity Scorer: scores resume bullets for fabrication risk, flags, and suggests rewrites

import { z } from "zod"
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

export const ResumeBulletIntegritySchema = z.object({
  bullet: z.string(),
  risk_score: z.number().min(0).max(1),
  risk_level: z.enum(["low", "medium", "high"]),
  flag_reason: z.string().optional(),
  suggested_rewrite: z.string().optional(),
})

export async function scoreResumeBullets(bullets: string[]): Promise<z.infer<typeof ResumeBulletIntegritySchema>[]> {
  const prompt = `You are a resume integrity scorer. For each bullet, return a risk score (0-1), risk level (low/medium/high), and a flag reason if any claim is implausible, unverifiable, or AI-inflated. Suggest a rewrite if needed. Respond as JSON array.`
  const result = await generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: z.array(ResumeBulletIntegritySchema) }),
    prompt: `${prompt}\n\n${JSON.stringify(bullets)}`,
  })
  return result.experimental_output
}
