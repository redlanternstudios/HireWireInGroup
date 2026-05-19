// LinkedIn ↔ Resume Consistency Engine
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const ConsistencyFlagSchema = z.object({
  field: z.string(),
  source_a: z.string(),
  source_b: z.string(),
  value_a: z.string().optional(),
  value_b: z.string().optional(),
  severity: z.enum(["cosmetic", "disqualifying"]),
  delta: z.string().optional(),
})

export async function checkResumeLinkedInConsistency(resume: unknown, linkedin: unknown) {
  return generateStructuredText(
    {
      model: CLAUDE_MODELS.SONNET,
      schema: z.array(ConsistencyFlagSchema),
      schemaDescription: `Array of: { "field": string, "source_a": string, "source_b": string, "value_a": string, "value_b": string, "severity": "cosmetic"|"disqualifying", "delta": string }`,
      contextPrompt: `Compare the following resume and LinkedIn profile data. For each field (title, company, date_range, etc.), flag any contradictions. Return a JSON array of { field, source_a, source_b, value_a, value_b, severity, delta }.\n\nResume: ${JSON.stringify(resume)}\nLinkedIn: ${JSON.stringify(linkedin)}`,
    },
    { route: "resume-linkedin-consistency" }
  )
}
