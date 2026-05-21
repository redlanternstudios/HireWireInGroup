// Employer Verification Simulator
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const VerificationCheckSchema = z.object({
  claim_text: z.string(),
  org_name: z.string().optional(),
  check_result: z.enum(["verifiable", "unclear", "likely_unverifiable"]),
  confidence: z.number().min(0).max(1),
})

export async function simulateEmployerVerification(claims: { claim_text: string; org_name?: string }[]) {
  return generateStructuredText(
    {
      model: CLAUDE_MODELS.SONNET,
      schema: z.array(VerificationCheckSchema),
      schemaDescription: `Array of: { "claim_text": string, "org_name": string, "check_result": "verifiable"|"unclear"|"likely_unverifiable", "confidence": number 0-1 }`,
      contextPrompt: `For each claim, check if it is verifiable using public data and LinkedIn. Return a JSON array of { claim_text, org_name, check_result, confidence }.\n\n${JSON.stringify(claims)}`,
    },
    { route: "employer-verification" }
  )
}
