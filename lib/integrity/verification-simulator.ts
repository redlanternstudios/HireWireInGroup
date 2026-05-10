// Employer Verification Simulator
import { z } from "zod"
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

export const VerificationCheckSchema = z.object({
  claim_text: z.string(),
  org_name: z.string().optional(),
  check_result: z.enum(["verifiable", "unclear", "likely_unverifiable"]),
  confidence: z.number().min(0).max(1),
})

export async function simulateEmployerVerification(claims: { claim_text: string, org_name?: string }[]) {
  const prompt = `For each claim, check if it is verifiable using public data and LinkedIn. Return a JSON array of { claim_text, org_name, check_result, confidence }.`
  const result = await generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: z.array(VerificationCheckSchema) }),
    prompt: `${prompt}\n\n${JSON.stringify(claims)}`,
  })
  return result.experimental_output
}
