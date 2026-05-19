// Job-to-Profile Reality Gap Analyzer
import { z } from "zod"
import { generateStructuredText } from "@/lib/ai/gateway"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

export const GapAnalysisSchema = z.object({
  skill: z.string(),
  match: z.enum(["fit", "stretch", "reach"]),
  reason: z.string().nullable(),
})

const GapAnalysisResultsSchema = z.object({
  results: z.array(GapAnalysisSchema),
})

const GAP_ANALYSIS_RESULTS_SCHEMA_DESCRIPTION = `{
  "results": Array<{
    "skill": string,
    "match": "fit" | "stretch" | "reach",
    "reason": string | null
  }>
}`

export async function analyzeJobProfileGap(jobDescription: string, resume: any) {
  const prompt = `Compare the job description and candidate's resume. For each required skill, classify as fit, stretch, or reach. Return an object with a results array of { skill, match, reason }.`
  const result = await generateStructuredText({
    model: CLAUDE_MODELS.SONNET,
    schema: GapAnalysisResultsSchema,
    schemaDescription: GAP_ANALYSIS_RESULTS_SCHEMA_DESCRIPTION,
    prompt: `${prompt}\n\nJob Description: ${jobDescription}\nResume: ${JSON.stringify(resume)}`,
  })
  return result.results ?? []
}
