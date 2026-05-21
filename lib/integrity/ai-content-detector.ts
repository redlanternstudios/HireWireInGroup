// AI-Generated Content Detector
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const AIContentFlagSchema = z.object({
  section: z.string(),
  ai_confidence_score: z.number().min(0).max(1),
  flagged_phrases: z.array(z.string()).optional(),
})

export async function detectAIContent(resumeText: string) {
  return generateStructuredText(
    {
      model: CLAUDE_MODELS.SONNET,
      schema: z.array(AIContentFlagSchema),
      schemaDescription: `Array of: { "section": string, "ai_confidence_score": number 0-1, "flagged_phrases": string[] }`,
      contextPrompt: `Analyze the following resume text. For each section, return an AI confidence score (0-1) and any phrases that appear AI-generated or generic.\n\n${resumeText}`,
    },
    { route: "detect-ai-content" }
  )
}
