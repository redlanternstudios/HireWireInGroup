/**
 * lib/linkedin/extractLinkedInProfile.ts
 *
 * LinkedIn-specific AI extraction using the same AI SDK pattern as
 * lib/resumeParser.ts and lib/resume/extractEducation.ts.
 *
 * Returns a fully typed LinkedInCaptureResult with status labels,
 * source excerpts, and a strict separation of activity from experience.
 *
 * CRITICAL INVARIANTS enforced by prompt + Zod validation:
 *   - Activity entries NEVER bleed into experience.
 *   - Reposts are captured as activity only, capture_for_resume always false.
 *   - Every "explicit" item MUST have a non-null source_excerpt.
 *   - No data is invented — missing fields get status "missing", value null.
 */

import { generateText, Output } from "ai"
import { z } from "zod"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

// ── Status label ──────────────────────────────────────────────────────────────

export const StatusLabel = z.enum(["explicit", "inferred", "missing", "noise"])
export type StatusLabel = z.infer<typeof StatusLabel>

// ── Identity ──────────────────────────────────────────────────────────────────

const IdentitySchema = z.object({
  full_name: z.string().nullable(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  current_company: z.string().nullable(),
  education_brand: z.string().nullable(),
  followers: z.number().nullable(),
  connections: z.string().nullable(),
  contact_info_present: z.boolean(),
})

export type LinkedInIdentity = z.infer<typeof IdentitySchema>

// ── Experience ────────────────────────────────────────────────────────────────

const ExperienceEntrySchema = z.object({
  status: StatusLabel,
  source_excerpt: z.string().nullable(),
  company: z.string().nullable(),
  role_title: z.string().nullable(),
  employment_type: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  duration: z.string().nullable(),
  location: z.string().nullable(),
  work_mode: z.string().nullable(),
  skills_attached: z.array(z.string()),
  impact_claims_present: z.array(z.string()),
  impact_claims_missing: z.array(z.string()),
  promotion_or_progression: z.boolean(),
})

export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>

// ── Career Progression ────────────────────────────────────────────────────────

const CareerProgressionGroupSchema = z.object({
  company: z.string(),
  roles: z.array(z.string()),
  promotions_detected: z.boolean(),
})

export type CareerProgressionGroup = z.infer<typeof CareerProgressionGroupSchema>

// ── Education ─────────────────────────────────────────────────────────────────

const LinkedInEducationEntrySchema = z.object({
  status: StatusLabel,
  source_excerpt: z.string().nullable(),
  institution: z.string().nullable(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  honors: z.string().nullable(),
})

export type LinkedInEducationEntry = z.infer<typeof LinkedInEducationEntrySchema>

// ── Certifications ────────────────────────────────────────────────────────────

const CertificationEntrySchema = z.object({
  status: StatusLabel,
  source_excerpt: z.string().nullable(),
  certification_name: z.string().nullable(),
  issuer: z.string().nullable(),
  issued_date: z.string().nullable(),
  credential_url_present: z.boolean(),
})

export type CertificationEntry = z.infer<typeof CertificationEntrySchema>

// ── Skills ────────────────────────────────────────────────────────────────────

const SkillsSchema = z.object({
  raw_skills: z.array(z.string()),
  normalized_skills: z.array(z.string()),
  categorized: z.object({
    product: z.array(z.string()),
    technical: z.array(z.string()),
    leadership: z.array(z.string()),
    sales: z.array(z.string()),
    operations: z.array(z.string()),
    ai: z.array(z.string()),
  }),
  missing_high_value_skills: z.array(z.string()),
})

export type LinkedInSkills = z.infer<typeof SkillsSchema>

// ── About ─────────────────────────────────────────────────────────────────────

const AboutSchema = z.object({
  raw_text: z.string().nullable(),
  core_claims: z.array(z.string()),
  leadership_signals: z.array(z.string()),
  methodologies: z.array(z.string()),
  business_outcomes: z.array(z.string()),
  weak_language: z.array(z.string()),
  rewrite_opportunities: z.array(z.string()),
})

export type LinkedInAbout = z.infer<typeof AboutSchema>

// ── Social Proof ──────────────────────────────────────────────────────────────

const SocialProofSchema = z.object({
  followers: z.number().nullable(),
  connections: z.string().nullable(),
  profile_views: z.number().nullable(),
  post_impressions: z.number().nullable(),
  search_appearances: z.number().nullable(),
})

export type LinkedInSocialProof = z.infer<typeof SocialProofSchema>

// ── Activity ──────────────────────────────────────────────────────────────────

const ActivityEntrySchema = z.object({
  post_type: z.enum(["original", "repost", "comment", "unknown"]),
  topic: z.string().nullable(),
  engagement: z.string().nullable(),
  capture_for_resume: z.boolean(),
})

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>

// ── Validation ────────────────────────────────────────────────────────────────

const ValidationSchema = z.object({
  explicit_claim_count: z.number(),
  inferred_claim_count: z.number(),
  missing_field_count: z.number(),
  safe_for_resume_generation: z.boolean(),
  safe_for_job_matching: z.boolean(),
  requires_user_review: z.boolean(),
})

export type LinkedInValidation = z.infer<typeof ValidationSchema>

// ── Top-level result ──────────────────────────────────────────────────────────

export const LinkedInCaptureResultSchema = z.object({
  identity: IdentitySchema,
  experience: z.array(ExperienceEntrySchema),
  career_progression: z.array(CareerProgressionGroupSchema),
  education: z.array(LinkedInEducationEntrySchema),
  certifications: z.array(CertificationEntrySchema),
  skills: SkillsSchema,
  about: AboutSchema,
  social_proof: SocialProofSchema,
  activity: z.array(ActivityEntrySchema),
  noise_removed: z.array(z.string()),
  validation: ValidationSchema,
})

export type LinkedInCaptureResult = z.infer<typeof LinkedInCaptureResultSchema>

// ── User context ──────────────────────────────────────────────────────────────

export interface UserProfileContext {
  full_name?: string | null
  headline?: string | null
  location?: string | null
  summary?: string | null
}

function buildContextBlock(ctx: UserProfileContext): string {
  const lines: string[] = []
  if (ctx.full_name) lines.push(`Name: ${ctx.full_name}`)
  if (ctx.headline) lines.push(`Current positioning: ${ctx.headline}`)
  if (ctx.location) lines.push(`Location: ${ctx.location}`)
  if (lines.length === 0) return ""
  return `KNOWN USER CONTEXT (use this to ground your extraction)
${lines.join("\n")}

Apply this context as follows:
- Cross-reference the extracted identity against the known user — flag any discrepancies as notes in rewrite_opportunities.
- Evaluate each experience entry for relevance to the user's current positioning. Roles directly related to their headline (e.g. AI, TPM, product, engineering) are high relevance. Roles from a different career phase (e.g. sales, fitness, mortgage) are lower relevance — still capture them, but note in impact_claims_missing that strategic reframing may be needed.
- If the About section contains first-person plural language ("we", "our team", "our processes", "we built", "our clients"), add this exact string to about.rewrite_opportunities: "About section uses team voice ('we/our') — rewrite in first person to reflect your individual contributions." Also set validation.requires_user_review to true.

`
}

// ── Extraction prompt ─────────────────────────────────────────────────────────

const EXTRACTION_PROMPT_BASE = `You are extracting structured professional data from raw LinkedIn profile text.

Return ONLY valid JSON matching the exact schema described below. No markdown, no explanation, no code blocks. The response must be parseable by JSON.parse().

CRITICAL RULES — violations corrupt the data:
1. NEVER move activity feed posts into the experience array. Experience = jobs held. Activity = posts made.
2. Reposts are NEVER the user's achievement. Text like "[Name] reposted" indicates a repost — put it in activity with post_type "repost" and capture_for_resume false.
3. Every item with status "explicit" MUST have a non-null source_excerpt quoting the verbatim text from the profile.
4. Never invent dates, companies, roles, degrees, certifications, or metrics not present in the text.
5. If a field is expected but not found, set status "missing" and value null.
6. capture_for_resume is false for ALL reposts and activity items without verifiable professional proof authored by this user.
7. Status labels: "explicit" = directly present (include source_excerpt), "inferred" = reasonably concluded but not stated verbatim, "missing" = expected but absent, "noise" = UI artifact to discard.
8. If the About section uses "we", "our team", or "our" to describe work, add a rewrite_opportunity flagging team voice and set requires_user_review to true.

SCHEMA (return exactly this structure):
{
  "identity": {
    "full_name": string | null,
    "headline": string | null,
    "location": string | null,
    "current_company": string | null,
    "education_brand": string | null,
    "followers": number | null,
    "connections": string | null,
    "contact_info_present": boolean
  },
  "experience": [
    {
      "status": "explicit" | "inferred" | "missing" | "noise",
      "source_excerpt": string | null,
      "company": string | null,
      "role_title": string | null,
      "employment_type": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "duration": string | null,
      "location": string | null,
      "work_mode": string | null,
      "skills_attached": string[],
      "impact_claims_present": string[],
      "impact_claims_missing": string[],
      "promotion_or_progression": boolean
    }
  ],
  "career_progression": [
    {
      "company": string,
      "roles": string[],
      "promotions_detected": boolean
    }
  ],
  "education": [
    {
      "status": "explicit" | "inferred" | "missing" | "noise",
      "source_excerpt": string | null,
      "institution": string | null,
      "degree": string | null,
      "field": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "honors": string | null
    }
  ],
  "certifications": [
    {
      "status": "explicit" | "inferred" | "missing" | "noise",
      "source_excerpt": string | null,
      "certification_name": string | null,
      "issuer": string | null,
      "issued_date": string | null,
      "credential_url_present": boolean
    }
  ],
  "skills": {
    "raw_skills": string[],
    "normalized_skills": string[],
    "categorized": {
      "product": string[],
      "technical": string[],
      "leadership": string[],
      "sales": string[],
      "operations": string[],
      "ai": string[]
    },
    "missing_high_value_skills": string[]
  },
  "about": {
    "raw_text": string | null,
    "core_claims": string[],
    "leadership_signals": string[],
    "methodologies": string[],
    "business_outcomes": string[],
    "weak_language": string[],
    "rewrite_opportunities": string[]
  },
  "social_proof": {
    "followers": number | null,
    "connections": string | null,
    "profile_views": number | null,
    "post_impressions": number | null,
    "search_appearances": number | null
  },
  "activity": [
    {
      "post_type": "original" | "repost" | "comment" | "unknown",
      "topic": string | null,
      "engagement": string | null,
      "capture_for_resume": boolean
    }
  ],
  "noise_removed": string[],
  "validation": {
    "explicit_claim_count": number,
    "inferred_claim_count": number,
    "missing_field_count": number,
    "safe_for_resume_generation": boolean,
    "safe_for_job_matching": boolean,
    "requires_user_review": boolean
  }
}

LINKEDIN PROFILE TEXT:
`

// ── Main extractor ────────────────────────────────────────────────────────────

export async function extractLinkedInProfile(
  cleanedText: string,
  userContext?: UserProfileContext
): Promise<LinkedInCaptureResult> {
  const contextBlock =
    userContext ? buildContextBlock(userContext) : ""

  const prompt = `${EXTRACTION_PROMPT_BASE}

${contextBlock}LINKEDIN PROFILE TEXT:
${cleanedText}`

  const result = await generateText({
    model: CLAUDE_MODELS.SONNET,
    output: Output.object({ schema: LinkedInCaptureResultSchema }),
    prompt,
  })

  const raw = result.experimental_output

  if (!raw || typeof raw !== "object") {
    throw new Error(
      "AI extraction returned invalid output — expected a JSON object."
    )
  }

  // Zod validates schema shape — throws ZodError if anything is wrong
  return LinkedInCaptureResultSchema.parse(raw)
}
