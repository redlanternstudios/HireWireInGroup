// AI-Generated Content Detector
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const AIContentFlagSchema = z.object({
  section: z.string(),
  ai_confidence_score: z.number().min(0).max(1),
  flagged_phrases: z.array(z.string()).nullable(),
})

const AIContentFlagsSchema = z.object({
  flags: z.array(AIContentFlagSchema),
})

const AI_CONTENT_FLAGS_SCHEMA_DESCRIPTION = `{
  "flags": Array<{
    "section": string,
    "ai_confidence_score": number,
    "flagged_phrases": string[] | null
  }>
}`

export async function detectAIContent(resumeText: string) {
  const prompt = `Analyze the following resume text. For each section, return an AI confidence score (0-1) and any phrases that appear AI-generated or generic. Return an object with a flags array.`
  const result = await generateStructuredText({
    model: CLAUDE_MODELS.SONNET,
    schema: AIContentFlagsSchema,
    schemaDescription: AI_CONTENT_FLAGS_SCHEMA_DESCRIPTION,
    prompt: `${prompt}\n\n${resumeText}`,
  })
  return result.flags ?? []
}
