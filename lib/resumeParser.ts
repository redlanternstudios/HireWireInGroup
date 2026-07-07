/**
 * resumeParser
 *
 * Extracts structured data from raw resume text using Claude via AI Gateway.
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

// NOTE: OpenAI strict json_schema mode (used by the AI gateway) requires every
// property to be listed in `required`. `.optional()` / `.default()` break it with
// "'required' ... must include every key". Use `.nullable()` instead — the field
// is present-but-nullable, which strict mode accepts. The consumer
// (mapResumeToEvidence) is already null-safe (?? [], ?.length, ?? null).
const WorkExperienceSchema = z.object({
  role: z.string().describe("Job title / role name"),
  company: z.string().describe("Employer name"),
  date_range: z.string().nullable().describe("e.g. Jan 2020 – Mar 2023"),
  location: z.string().nullable(),
  responsibilities: z.array(z.string()).nullable().describe("Key responsibilities or bullet points"),
  tools_used: z.array(z.string()).nullable().describe("Technologies, tools, frameworks mentioned"),
  outcomes: z.array(z.string()).nullable().describe("Measurable results or achievements"),
})

const EducationSchema = z.object({
  degree: z.string().describe("Degree name e.g. BSc Computer Science"),
  school: z.string().describe("Institution name"),
  field: z.string().nullable().describe("Field of study if separate from degree name"),
  date_range: z.string().nullable().describe("e.g. 2015 – 2019"),
  honors: z.string().nullable().describe("Honors, GPA, distinctions"),
})

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  date: z.string().nullable(),
})

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  tech_stack: z.array(z.string()).nullable(),
  outcomes: z.array(z.string()).nullable(),
  url: z.string().nullable(),
})

const ParsedResumeSchema = z.object({
  work_experience: z.array(WorkExperienceSchema).describe("All work history entries"),
  education: z.array(EducationSchema).describe("All education entries"),
  skills: z.array(z.string()).describe("Soft and hard skills listed in skills section"),
  tools: z.array(z.string()).describe("Technical tools, languages, frameworks, platforms"),
  domains: z.array(z.string()).describe("Industry domains, subject areas"),
  certifications: z.array(CertificationSchema).nullable(),
  projects: z.array(ProjectSchema).nullable(),
  // Contact info
  full_name: z.string().nullable().describe("Candidate full name"),
  email: z.string().nullable().describe("Email address"),
  phone: z.string().nullable().describe("Phone number"),
  location: z.string().nullable().describe("City, state or country"),
  summary: z.string().nullable().describe("Professional summary or objective"),
  linkedin_url: z.string().nullable().describe("LinkedIn profile URL if present"),
  github_url: z.string().nullable().describe("GitHub profile URL if present"),
  website_url: z.string().nullable().describe("Personal website or portfolio URL if present"),
})

/**
 * Parse raw resume text into a structured ParsedResume object.
 * Uses Claude via AI Gateway for extraction.
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
  ) as Promise<ParsedResume>
}
