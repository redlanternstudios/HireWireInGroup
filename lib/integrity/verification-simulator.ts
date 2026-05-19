// Employer Verification Simulator
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const VerificationCheckSchema = z.object({
  claim_text: z.string(),
  org_name: z.string().nullable(),
  check_result: z.enum(["verifiable", "unclear", "likely_unverifiable"]),
  confidence: z.number().min(0).max(1),
})

const VerificationChecksSchema = z.object({
  results: z.array(VerificationCheckSchema),
})

const VERIFICATION_CHECKS_SCHEMA_DESCRIPTION = `{
  "results": Array<{
    "claim_text": string,
    "org_name": string | null,
    "check_result": "verifiable" | "unclear" | "likely_unverifiable",
    "confidence": number
  }>
}`

export async function simulateEmployerVerification(claims: { claim_text: string, org_name?: string }[]) {
  const prompt = `For each claim, check if it is verifiable using public data and LinkedIn. Return an object with a results array of { claim_text, org_name, check_result, confidence }.`
  const result = await generateStructuredText({
    model: CLAUDE_MODELS.SONNET,
    schema: VerificationChecksSchema,
    schemaDescription: VERIFICATION_CHECKS_SCHEMA_DESCRIPTION,
    prompt: `${prompt}\n\n${JSON.stringify(claims)}`,
  })
  return result.results ?? []
}
