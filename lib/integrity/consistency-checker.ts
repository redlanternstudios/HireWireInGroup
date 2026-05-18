// LinkedIn ↔ Resume Consistency Engine
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const ConsistencyFlagSchema = z.object({
  field: z.string(),
  source_a: z.string(),
  source_b: z.string(),
  value_a: z.string().nullable(),
  value_b: z.string().nullable(),
  severity: z.enum(["cosmetic", "disqualifying"]),
  delta: z.string().nullable(),
})

const ConsistencyFlagsSchema = z.object({
  flags: z.array(ConsistencyFlagSchema),
})

const CONSISTENCY_FLAGS_SCHEMA_DESCRIPTION = `{
  "flags": Array<{
    "field": string,
    "source_a": string,
    "source_b": string,
    "value_a": string | null,
    "value_b": string | null,
    "severity": "cosmetic" | "disqualifying",
    "delta": string | null
  }>
}`

export async function checkResumeLinkedInConsistency(resume: any, linkedin: any) {
  const prompt = `Compare the following resume and LinkedIn profile data. For each field (title, company, date_range, etc.), flag any contradictions. Return an object with a flags array of { field, source_a, source_b, value_a, value_b, severity, delta }.`
  const result = await generateStructuredText({
    model: CLAUDE_MODELS.SONNET,
    schema: ConsistencyFlagsSchema,
    schemaDescription: CONSISTENCY_FLAGS_SCHEMA_DESCRIPTION,
    prompt: `${prompt}\n\nResume: ${JSON.stringify(resume)}\nLinkedIn: ${JSON.stringify(linkedin)}`,
  })
  return result.flags ?? []
}
