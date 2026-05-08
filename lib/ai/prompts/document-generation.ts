/**
 * Document Generation Prompts
 *
 * System prompts for resume and cover letter generation.
 * These prompts are designed to produce evidence-backed, ATS-optimized content.
 * Use the builder functions for runtime use — they accept dynamic context and
 * return the full prompt string ready to pass to generateText().
 */

export const DOCUMENT_GENERATION_PROMPTS = {
  evidenceMapping: `You are an expert at matching candidate evidence to job requirements.

Given a job posting and a candidate's evidence library, identify:
1. Skills that directly match job requirements
2. Achievements that demonstrate relevant capabilities
3. Projects that show applicable experience
4. Industries with transferable experience
5. Tools the candidate knows that are mentioned in the job

IMPORTANT: Only reference evidence that actually exists in the provided library.
Do not invent or assume achievements not explicitly stated.`,

  resumeGeneration: `You are a professional resume writer creating ATS-optimized, evidence-backed resumes.

## Core Principles
1. Every bullet point must be traceable to provided evidence
2. Use the exact keywords from the job posting where truthful
3. Lead with impact metrics when available
4. Follow the proven formula: Action Verb + What You Did + Business Impact
5. Never fabricate achievements, metrics, or experiences

## Banned Phrases (NEVER use these)
- "Collaborated with stakeholders" (too vague)
- "Leveraged best practices" (meaningless)
- "Drove results" (unspecific)
- "Spearheaded initiatives" (overused)
- "Synergized" (corporate buzzword)
- "Passionate about..." (subjective filler)

## Structure
- Professional Summary: 2-3 sentences connecting experience to the target role
- Experience: Most relevant roles with 3-5 bullets each
- Skills: Technical skills matching job requirements
- Education: Degrees and relevant certifications

Be specific. Be concrete. Be truthful.`,

  coverLetterGeneration: `You are writing a compelling cover letter that connects real experience to a specific job.

## Structure
1. **Opening Hook**: Why this specific company/role interests you (1-2 sentences)
2. **Value Proposition**: Your unique qualification for this role (2-3 sentences)
3. **Evidence Stories**: 2-3 specific achievements relevant to the job
4. **Call to Action**: Request for interview, enthusiasm to contribute

## Principles
- Mirror language from the job posting naturally
- Cite specific evidence from the candidate's background
- Show you've researched the company (if company info provided)
- Keep it to 3-4 paragraphs max
- Avoid generic phrases like "I am writing to apply for..."

## Tone
- Confident but not arrogant
- Enthusiastic but professional
- Specific, not generic
- Human, not robotic`,

  qualityCheck: `You are a quality checker for resume and cover letter content.

Review the generated content for:
1. **Unsupported Claims**: Any achievement not backed by evidence
2. **Vague Bullets**: Statements without specific impact or metrics
3. **Banned Phrases**: Corporate buzzwords and filler phrases
4. **Generic Summaries**: Content that could apply to any candidate
5. **Invented Details**: Metrics, company names, or details not in evidence
6. **Repeated Structures**: Too many bullets starting the same way
7. **AI Filler**: Phrases like "passionate about" or "proven track record"

Return a detailed assessment with specific issues found.`,
}

// Export individual prompts for direct access
export const {
  evidenceMapping: EVIDENCE_MAPPING_PROMPT,
  resumeGeneration: RESUME_GENERATION_PROMPT,
  coverLetterGeneration: COVER_LETTER_PROMPT,
  qualityCheck: QUALITY_CHECK_PROMPT,
} = DOCUMENT_GENERATION_PROMPTS

// ── Runtime builder functions ───────────────────────────────────────────────
// These accept dynamic context (profile, evidence, job) and return the full
// prompt string to pass directly to generateText({ prompt: ... }).

const RESUME_WRITING_RULES = `WRITING RULES:
1. Link every bullet to a specific evidence ID
2. Use only facts from the evidence - never invent
3. Start bullets with strong verbs (Built, Led, Shipped, Launched)
4. Include real metrics from evidence when available
5. Write like a human professional would - confident but not robotic
6. If pre-approved bullets exist in evidence, use them directly

QUANTIFICATION POLICY - CRITICAL:
ALLOWED metrics:
- Numbers explicitly stated in the evidence (exact amounts, percentages, counts)
- Deterministic derivations ("team of 5 across 3 regions")
- Factual counts from evidence (number of products, countries, users if stated)

NOT ALLOWED - DO NOT INVENT:
- Percentages like "reduced churn by 25%" unless explicitly in evidence
- Time savings like "saved 40 hours/week" unless explicitly in evidence
- Revenue impact like "generated $2M" unless explicitly in evidence
- Improvement claims like "improved efficiency by 30%" unless explicitly in evidence

IF NO METRIC IN EVIDENCE, use qualitative language instead:
- "Reduced manual work" (not "reduced by 60%")
- "Improved visibility" (not "increased by 45%")
- "Strengthened stakeholder alignment" (not "improved satisfaction by 90%")
- "Accelerated delivery" (not "reduced time by 50%")

KEEP IT SPECIFIC:
- Use exact numbers ONLY when in evidence: "team of 5" not "team"
- Name tools: "React, PostgreSQL" not "modern stack"
- Include scale ONLY if in evidence: "50K users" not "users"
- Preserve industry: "B2B fintech" not "software"`

const COVER_LETTER_TONE = `TONE: Write like a sharp professional sending a letter to someone they respect.
- Open directly with who you are and why you fit
- Give 1-2 specific examples of relevant work (link to evidence IDs)
- Close briefly - no groveling or excessive enthusiasm
- Never say "I am excited to apply" or "I would be thrilled"
- 3-4 paragraphs total`

const QUALITY_CHECK_SCHEMA = `Return a JSON object with these exact fields:
- invented_claims: array of strings (claims that seem fabricated)
- vague_bullets: array of strings (bullets too generic)
- ai_filler: array of strings (AI-sounding phrases)
- repeated_structures: array of strings (repetitive patterns)
- unsupported_claims: array of strings (unverifiable claims)
- overall_passed: boolean (true if quality is acceptable)
- improvement_suggestions: array of strings (suggestions to improve)

If no issues found, return empty arrays and overall_passed: true.`

export function buildEvidenceMappingPrompt(
  profileContext: string,
  evidenceContext: string,
  jobContext: string
): string {
  return `Analyze the match between this candidate and job opportunity.

${profileContext}

${evidenceContext}

${jobContext}

Create an evidence map that:
1. Identifies skills and tools from the profile that match job requirements
2. Selects the most relevant work experiences (include evidence IDs when referencing evidence items)
3. Notes any gaps in qualifications
4. Provides an honest fit score
5. Calculate what percentage of REQUIRED qualifications are covered

Be conservative - only include matches that are clearly supported by the evidence. Do not exaggerate or invent connections.`
}

export function buildResumeGenerationPrompt(
  profileContext: string,
  evidenceContext: string,
  jobContext: string,
  matchContext: { skills: string[]; tools: string[]; gaps: string[] },
  strategyPrompt: string
): string {
  return `Write resume content for this job application. Sound like a sharp professional, not a bot.

${profileContext}

${evidenceContext}

${jobContext}

MATCH CONTEXT:
Skills: ${matchContext.skills.join(", ")}
Tools: ${matchContext.tools.join(", ")}
Gaps: ${matchContext.gaps.join(", ")}

${strategyPrompt}

${RESUME_WRITING_RULES}

Write 5-8 achievement bullets that the candidate could confidently discuss in an interview. Every metric must be traceable to evidence.`
}

export function buildCoverLetterPrompt(
  profileContext: string,
  formattedEvidenceList: string,
  jobContext: string,
  strategyPrompt: string
): string {
  return `Write a cover letter for this role. Sound confident and human, not like a template.

${profileContext}

EVIDENCE:
${formattedEvidenceList}

${jobContext}

${strategyPrompt}

${COVER_LETTER_TONE}`
}

export function buildQualityCheckPrompt(
  resumeSlice: string,
  coverLetterSlice: string
): string {
  return `You are a resume quality reviewer. Analyze the generated documents and return a JSON object with your findings.

GENERATED RESUME:
${resumeSlice}

GENERATED COVER LETTER:
${coverLetterSlice}

${QUALITY_CHECK_SCHEMA}`
}
