// LinkedIn ↔ Resume Consistency Engine
import { z } from "zod"
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

export const ConsistencyFlagSchema = z.object({
  field: z.string(),
  source_a: z.string(),
  source_b: z.string(),
  value_a: z.string().optional(),
  value_b: z.string().optional(),
  severity: z.enum(["cosmetic", "disqualifying"]),
  delta: z.string().optional(),
})

export async function checkResumeLinkedInConsistency(resume: any, linkedin: any) {
  const prompt = `Compare the following resume and LinkedIn profile data. For each field (title, company, date_range, etc.), flag any contradictions. Return a JSON array of { field, source_a, source_b, value_a, value_b, severity, delta }.`
  const result = await generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: z.array(ConsistencyFlagSchema) }),
    prompt: `${prompt}\n\nResume: ${JSON.stringify(resume)}\nLinkedIn: ${JSON.stringify(linkedin)}`,
  })
  return result.experimental_output
}
