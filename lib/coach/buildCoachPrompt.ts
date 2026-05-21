/**
 * lib/coach/buildCoachPrompt.ts
 *
 * Builds the system prompt and message history for the AI Career Coach.
 * The coach is anchored to a specific gap requirement and helps the user
 * articulate real experience that satisfies it.
 *
 * Evidence drafts are signaled via <evidence_draft>{json}</evidence_draft> tags.
 */

export type CoachMessage = {
  role: "user" | "assistant"
  content: string
}

export type CoachContext = {
  gapRequirement: string
  requirementId?: string | null
  requirementIntent?: string | null
  currentEvidence?: string[]
  jobTitle: string
  jobCompany: string
  jobDescriptionSummary: string
  existingEvidenceTitles: string[]
  priorMessages: CoachMessage[]
}

// ── System prompt ─────────────────────────────────────────────────────────────

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const existingList = ctx.existingEvidenceTitles.length > 0
    ? ctx.existingEvidenceTitles.map((t) => `  - ${t}`).join("\n")
    : "  (none yet)"

  return `
You are an expert AI Career Coach embedded inside HireWire.
Your job is to translate a specific job expectation into user-confirmed proof.

══════════════════════════════════════════
CURRENT REQUIREMENT: "${ctx.gapRequirement}"
REQUIREMENT ID: ${ctx.requirementId ?? "not provided"}
JOB: ${ctx.jobTitle} at ${ctx.jobCompany}
DESCRIPTION: ${ctx.jobDescriptionSummary}
EMPLOYER INTENT: ${ctx.requirementIntent ?? "Infer from the requirement and job description."}
CURRENT PROOF FOR THIS REQUIREMENT:
${(ctx.currentEvidence ?? []).length > 0 ? (ctx.currentEvidence ?? []).map((t) => `  - ${t}`).join("\n") : "  (none mapped yet)"}
EXISTING EVIDENCE:
${existingList}
══════════════════════════════════════════

RULES:
1. Ask one focused question per turn.
2. Questions must start from the employer intent behind the requirement above.
3. Do not assume or invent experience the user has not described.
4. Recover ownership, scope, stakeholders, systems, outcomes, and constraints.
5. Always confirm before saving — show the draft and ask if it is accurate.
6. If the user lacks direct experience, help them find adjacent experience without overstating it.
7. Do not duplicate evidence already in the library.
8. Keep responses concise — no more than 3 short paragraphs.
9. Never use: "results-driven", "dynamic professional", "seasoned leader",
   "proven track record", "team player", "spearheaded", "passionate about".
10. Draft evidence only from user-confirmed details. Refuse to upgrade vague answers into strong claims.

EVIDENCE DRAFT FORMAT — output this tag with valid JSON, no markdown:

<evidence_draft>
{
  "source_title": "Brief role or project title (under 80 chars)",
  "source_type": "work_experience",
  "proof_snippet": "First-person, past-tense, outcome statement. Under 200 chars.",
  "confidence_level": "high",
  "skills": ["skill1", "skill2"]
}
</evidence_draft>

After the tag always write:
"Does this accurately capture what you described? Confirm to save it, or tell me what to change."
`.trim()
}

export function buildCoachMessages(ctx: CoachContext): CoachMessage[] {
  return Array.isArray(ctx.priorMessages) ? ctx.priorMessages : []
}

export function buildOpeningPrompt(
  gapRequirement: string,
  jobTitle: string,
  options: { company?: string | null; intent?: string | null; recoveryQuestion?: string | null } = {}
): string {
  const company = options.company ? ` at ${options.company}` : ""
  const intent = options.intent ? `\n\nWhat the employer is likely checking: ${options.intent}` : ""
  const question = options.recoveryQuestion ??
    `What's one real project, responsibility, or result where you showed this, even indirectly?`

  return `I'm your career coach. We're working on this specific requirement for ${jobTitle}${company}:

"${gapRequirement}"
${intent}

${question}`.trim()
}

// ── Evidence draft parser ─────────────────────────────────────────────────────

export type EvidenceDraftPayload = {
  source_title: string
  source_type: string
  proof_snippet: string
  confidence_level: string
  skills: string[]
}

export function parseEvidenceDraft(text: string): EvidenceDraftPayload | null {
  const match = text.match(/<evidence_draft>([\s\S]*?)<\/evidence_draft>/)
  if (!match) return null
  try {
    const raw = JSON.parse(match[1].trim())
    return {
      source_title: String(raw.source_title ?? "").slice(0, 80),
      source_type: String(raw.source_type ?? "work_experience"),
      proof_snippet: String(raw.proof_snippet ?? "").slice(0, 500),
      confidence_level: String(raw.confidence_level ?? "high"),
      skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    }
  } catch {
    return null
  }
}

export function stripEvidenceDraftTag(text: string): string {
  return text.replace(/<evidence_draft>[\s\S]*?<\/evidence_draft>/g, "").trim()
}
