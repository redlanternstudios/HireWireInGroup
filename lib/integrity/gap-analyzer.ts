// Job-to-Profile Reality Gap Analyzer
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const GapAnalysisSchema = z.object({
  skill: z.string(),
  match: z.enum(["fit", "stretch", "reach"]),
  reason: z.string().optional(),
})

export async function analyzeJobProfileGap(jobDescription: string, resume: unknown) {
  return generateStructuredText(
    {
      model: CLAUDE_MODELS.SONNET,
      schema: z.array(GapAnalysisSchema),
      schemaDescription: `Array of: { "skill": string, "match": "fit"|"stretch"|"reach", "reason": string }`,
      contextPrompt: `Compare the job description and candidate's resume. For each required skill, classify as fit, stretch, or reach. Return a JSON array of { skill, match, reason }.\n\nJob Description: ${jobDescription}\nResume: ${JSON.stringify(resume)}`,
    },
    { route: "job-profile-gap" }
  )
}
