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

const WorkExperienceSchema = z.object({
  role: z.string().describe("Job title / role name"),
  company: z.string().describe("Employer name"),
  date_range: z.string().nullable().describe("e.g. Jan 2020 – Mar 2023, or null if absent"),
  location: z.string().nullable(),
  responsibilities: z.array(z.string()).describe("Key responsibilities or bullet points"),
  tools_used: z.array(z.string()).describe("Technologies, tools, frameworks mentioned"),
  outcomes: z.array(z.string()).describe("Measurable results or achievements"),
})

const EducationSchema = z.object({
  degree: z.string().describe("Degree name e.g. BSc Computer Science"),
  school: z.string().describe("Institution name"),
  field: z.string().nullable().describe("Field of study if separate from degree name, or null"),
  date_range: z.string().nullable().describe("e.g. 2015 – 2019, or null if absent"),
  honors: z.string().nullable().describe("Honors, GPA, distinctions, or null"),
})

const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  date: z.string().nullable(),
})

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  tech_stack: z.array(z.string()),
  outcomes: z.array(z.string()),
  url: z.string().nullable(),
})

const ParsedResumeSchema = z.object({
  work_experience: z.array(WorkExperienceSchema).describe("All work history entries"),
  education: z.array(EducationSchema).describe("All education entries"),
  skills: z.array(z.string()).describe("Soft and hard skills listed in skills section"),
  tools: z.array(z.string()).describe("Technical tools, languages, frameworks, platforms"),
  domains: z.array(z.string()).describe("Industry domains, subject areas"),
  certifications: z.array(CertificationSchema),
  projects: z.array(ProjectSchema),
  // Contact info
  full_name: z.string().nullable().describe("Candidate full name, or null if absent"),
  email: z.string().nullable().describe("Email address, or null if absent"),
  phone: z.string().nullable().describe("Phone number, or null if absent"),
  location: z.string().nullable().describe("City, state or country, or null if absent"),
  summary: z.string().nullable().describe("Professional summary or objective, or null if absent"),
  linkedin_url: z.string().nullable().describe("LinkedIn profile URL if present, otherwise null"),
  github_url: z.string().nullable().describe("GitHub profile URL if present, otherwise null"),
  website_url: z.string().nullable().describe("Personal website or portfolio URL if present, otherwise null"),
})

const PARSED_RESUME_SCHEMA_DESCRIPTION = `{
  "work_experience": Array<{ "role": string, "company": string, "date_range": string | null, "location": string | null, "responsibilities": string[], "tools_used": string[], "outcomes": string[] }>,
  "education": Array<{ "degree": string, "school": string, "field": string | null, "date_range": string | null, "honors": string | null }>,
  "skills": string[],
  "tools": string[],
  "domains": string[],
  "certifications": Array<{ "name": string, "issuer": string | null, "date": string | null }>,
  "projects": Array<{ "name": string, "description": string | null, "tech_stack": string[], "outcomes": string[], "url": string | null }>,
  "full_name": string | null,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "summary": string | null,
  "linkedin_url": string | null,
  "github_url": string | null,
  "website_url": string | null
}`

function optionalString(value: string | null): string | undefined {
  return value ?? undefined
}

/**
 * Parse raw resume text into a structured ParsedResume object.
 * Uses Claude via AI Gateway for extraction.
 */
export async function parseResumeText(resumeText: string): Promise<ParsedResume> {
  const parsed = await generateStructuredText({
    model: CLAUDE_MODELS.SONNET,
    schema: ParsedResumeSchema,
    schemaDescription: PARSED_RESUME_SCHEMA_DESCRIPTION,
    prompt: `Extract all structured information from the following resume text.
Be thorough and accurate. Do not invent information not present in the text.
Return empty arrays for sections that are not present.

RESUME TEXT:
${resumeText}`,
  })

  return {
    ...parsed,
    work_experience: parsed.work_experience.map((exp) => ({
      ...exp,
      date_range: optionalString(exp.date_range),
      location: optionalString(exp.location),
    })),
    education: parsed.education.map((edu) => ({
      ...edu,
      field: optionalString(edu.field),
      date_range: optionalString(edu.date_range),
      honors: optionalString(edu.honors),
    })),
    certifications: parsed.certifications.map((cert) => ({
      ...cert,
      issuer: optionalString(cert.issuer),
      date: optionalString(cert.date),
    })),
    projects: parsed.projects.map((project) => ({
      ...project,
      description: optionalString(project.description),
      url: optionalString(project.url),
    })),
    full_name: optionalString(parsed.full_name),
    email: optionalString(parsed.email),
    phone: optionalString(parsed.phone),
    location: optionalString(parsed.location),
    summary: optionalString(parsed.summary),
    linkedin_url: optionalString(parsed.linkedin_url),
    github_url: optionalString(parsed.github_url),
    website_url: optionalString(parsed.website_url),
  }
}
