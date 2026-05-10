// Job-to-Profile Reality Gap Analyzer
import { z } from "zod"
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

export const GapAnalysisSchema = z.object({
  skill: z.string(),
  match: z.enum(["fit", "stretch", "reach"]),
  reason: z.string().optional(),
})

export async function analyzeJobProfileGap(jobDescription: string, resume: any) {
  const prompt = `Compare the job description and candidate's resume. For each required skill, classify as fit, stretch, or reach. Return a JSON array of { skill, match, reason }.`
  const result = await generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: z.array(GapAnalysisSchema) }),
    prompt: `${prompt}\n\nJob Description: ${jobDescription}\nResume: ${JSON.stringify(resume)}`,
  })
  return result.experimental_output
}
