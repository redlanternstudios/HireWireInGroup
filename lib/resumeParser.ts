/**
 * resumeParser
 *
 * Extracts structured data from raw resume text using the canonical AI Gateway.
 * Returns a ParsedResume that mapResumeToEvidence can consume.
 *
 * Kept as a separate helper so the upload route stays thin
 * and this logic can be reused by future parse endpoints.
 */

import { generateStructuredText } from "@/lib/ai/gateway"
import { z } from "zod"
import type { ParsedResume } from "./mapResumeToEvidence"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"

// ── Zod schemas for structured extraction ─────────────────────────────────

const StringArraySchema = z.preprocess(
  (value) => typeof value === "string" ? [value] : value,
  z.array(z.string()).default([])
)

const WorkExperienceSchema = z.object({
  role: z.string().optional().describe("Job title or role name"),
  title: z.string().optional().describe("Alias for role"),
  job_title: z.string().optional().describe("Alias for role"),
  company: z.string().optional().describe("Employer name"),
  company_name: z.string().optional().describe("Alias for company"),
  employer: z.string().optional().describe("Alias for company"),
  date_range: z.string().optional().describe("e.g. Jan 2020 – Mar 2023"),
  location: z.string().optional(),
  responsibilities: StringArraySchema.optional().describe("Key responsibilities or bullet points"),
  bullets: StringArraySchema.optional().describe("Alias for responsibilities"),
  tools_used: StringArraySchema.optional().describe("Technologies, tools, frameworks mentioned"),
  tools: StringArraySchema.optional().describe("Alias for tools used"),
  outcomes: StringArraySchema.optional().describe("Measurable results or achievements"),
  achievements: StringArraySchema.optional().describe("Alias for outcomes"),
}).transform((entry, context) => {
  const role = entry.role ?? entry.title ?? entry.job_title
  const company = entry.company ?? entry.company_name ?? entry.employer

  if (!role || !company) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Every work experience entry requires a role and company",
    })
    return z.NEVER
  }

  return {
    role,
    company,
    date_range: entry.date_range,
    location: entry.location,
    responsibilities: entry.responsibilities ?? entry.bullets,
    tools_used: entry.tools_used ?? entry.tools,
    outcomes: entry.outcomes ?? entry.achievements,
  }
})

const EducationSchema = z.object({
  degree: z.string().optional().describe("Degree name e.g. BSc Computer Science"),
  degree_name: z.string().optional().describe("Alias for degree"),
  school: z.string().optional().describe("Institution name"),
  institution: z.string().optional().describe("Alias for school"),
  field: z.string().optional().describe("Field of study if separate from degree name"),
  date_range: z.string().optional().describe("e.g. 2015 – 2019"),
  honors: z.string().optional().describe("Honors, GPA, distinctions"),
}).transform((entry, context) => {
  const degree = entry.degree ?? entry.degree_name
  const school = entry.school ?? entry.institution

  if (!degree || !school) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Every education entry requires a degree and school",
    })
    return z.NEVER
  }

  return {
    degree,
    school,
    field: entry.field,
    date_range: entry.date_range,
    honors: entry.honors,
  }
})

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
})

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  tech_stack: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  url: z.string().optional(),
})

const ParsedResumeSchema = z.object({
  work_experience: z.array(WorkExperienceSchema).default([]).describe("All work history entries"),
  education: z.array(EducationSchema).default([]).describe("All education entries"),
  skills: StringArraySchema.describe("Soft and hard skills listed in skills section"),
  tools: StringArraySchema.describe("Technical tools, languages, frameworks, platforms"),
  domains: StringArraySchema.describe("Industry domains, subject areas"),
  certifications: z.array(CertificationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  // Contact info
  full_name: z.string().optional().describe("Candidate full name"),
  email: z.string().optional().describe("Email address"),
  phone: z.string().optional().describe("Phone number"),
  location: z.string().optional().describe("City, state or country"),
  summary: z.string().optional().describe("Professional summary or objective"),
  linkedin_url: z.string().optional().describe("LinkedIn profile URL if present"),
  github_url: z.string().optional().describe("GitHub profile URL if present"),
  website_url: z.string().optional().describe("Personal website or portfolio URL if present"),
})

/**
 * Parse raw resume text into a structured ParsedResume object.
 * Uses the canonical AI Gateway for extraction.
 */
export async function parseResumeText(resumeText: string): Promise<ParsedResume> {
  return generateStructuredText(
    {
      model: CLAUDE_MODELS.SONNET,
      schema: ParsedResumeSchema,
      schemaDescription: `{ "work_experience": [...], "education": [...], "skills": string[], "tools": string[], "domains": string[], "certifications": [...], "projects": [...], "full_name": string, "email": string, "phone": string, "location": string, "summary": string, "linkedin_url": string, "github_url": string, "website_url": string }`,
      contextPrompt: `Extract all structured information from the following resume text.
Be thorough and accurate. Do not invent information not present in the text.
Return empty arrays for sections that are not present.

RESUME TEXT:
${resumeText}`,
    },
    { route: "parse-resume-text" }
  )
}
