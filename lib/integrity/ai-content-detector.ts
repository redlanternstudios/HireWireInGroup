// AI-Generated Content Detector
import { z } from "zod"
import { Output } from "ai"
import { generateText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const AIContentFlagSchema = z.object({
  section: z.string(),
  ai_confidence_score: z.number().min(0).max(1),
  flagged_phrases: z.array(z.string()).optional(),
})

export async function detectAIContent(resumeText: string) {
  const prompt = `Analyze the following resume text. For each section, return an AI confidence score (0-1) and any phrases that appear AI-generated or generic.`
  const result = await generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: z.array(AIContentFlagSchema) }),
    prompt: `${prompt}\n\n${resumeText}`,
  })
  return result.experimental_output
}
