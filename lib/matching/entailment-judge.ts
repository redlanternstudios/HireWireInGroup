/**
 * Semantic Matching — Subsystem B: the entailment judge.
 *
 * The honest primitive is entailment, not token overlap: *does this evidence
 * satisfy this requirement?* — a judged verdict with a citation, not a distance.
 * This replaces the containment-biased overlapScore (a 3-word requirement fully
 * contained in a long evidence blob scored 1.0 "met" regardless of relevance).
 *
 * Returns { status, confidence, cited_evidence_id, reasoning } where `status`
 * (met | partial | gap) is the exact field the fit resolver already trusts, so
 * it drops in with zero fit-code change. `not_a_requirement` feeds extraction
 * cleaning (boilerplate, headers, company-values lines).
 *
 * Honesty guard (spec §B): a `met` verdict MUST carry a citation to a specific
 * evidence id. No citation → downgrade to `partial`. The citation is also the
 * community/audit defense.
 */
import { z } from "zod"
import { AI_MODELS, generateStructuredText } from "@/lib/ai/gateway"

type JudgeTelemetry = {
  route?: string
  operation?: string
  userId?: string | null
  jobId?: string | null
}

export const EntailmentVerdictSchema = z.object({
  status: z.enum(["met", "partial", "gap", "not_a_requirement"]),
  confidence: z.enum(["high", "medium", "low"]),
  cited_evidence_id: z
    .string()
    .nullable()
    .describe("The evidence id that satisfies the requirement. Required for a 'met' verdict; null otherwise."),
  reasoning: z.string().describe("One or two sentences. Why this verdict, referencing seniority/depth where relevant."),
})

export type EntailmentVerdict = z.infer<typeof EntailmentVerdictSchema>

export type JudgeEvidence = { id: string; text: string }

const SYSTEM = `You are a strict hiring-evidence judge for HireWire. HireWire's promise is that a match means the candidate's real evidence actually satisfies the requirement — never keyword overlap, never invented capability.

Judge by ENTAILMENT, not word overlap:
- "met": the evidence clearly satisfies the requirement, INCLUDING seniority/level and depth. You MUST cite the evidence id that carries it.
- "partial": related but under-qualified, thin, off on level, or adjacent (e.g. "was on a team" for a "led a team" requirement; a different-but-similar technology).
- "gap": the evidence does not satisfy the requirement.
- "not_a_requirement": the text is boilerplate — a posting header, a label like "ABOUT YOU", a job title, or company-values marketing — not a real hiring requirement.

Rules:
- Seniority and depth count. "6 years Python" does not satisfy "5 years Java". "Contributed to" does not satisfy "led/owned".
- Never return "met" without citing a specific evidence id.
- Be conservative. When the evidence only loosely relates, it is "partial", not "met".`

export async function judgeRequirement(
  requirement: string,
  evidence: JudgeEvidence[],
  telemetry?: JudgeTelemetry,
): Promise<EntailmentVerdict> {
  const evidenceBlock =
    evidence.length > 0
      ? evidence.map((e) => `[${e.id}] ${e.text}`).join("\n")
      : "(no candidate evidence)"

  const prompt = `${SYSTEM}

REQUIREMENT:
"${requirement}"

CANDIDATE EVIDENCE (id in brackets):
${evidenceBlock}

Return the verdict.`

  const verdict = await generateStructuredText(
    {
      model: AI_MODELS.PRIMARY,
      schema: EntailmentVerdictSchema,
      schemaDescription:
        "status: met|partial|gap|not_a_requirement; confidence: high|medium|low; cited_evidence_id: string|null (required for met); reasoning: string",
      prompt,
      temperature: 0,
    },
    { route: "matching/entailment-judge", operation: "judge_requirement", ...telemetry },
  )

  // Honesty guard: met requires a citation.
  if (verdict.status === "met" && !verdict.cited_evidence_id) {
    return {
      ...verdict,
      status: "partial",
      reasoning: `${verdict.reasoning} [downgraded to partial: 'met' carried no evidence citation]`,
    }
  }
  return verdict
}
