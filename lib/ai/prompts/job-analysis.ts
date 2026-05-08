/**
 * Job Analysis Prompt
 *
 * Used when parsing job postings from URLs.
 * Extracts structured data for scoring and document generation.
 */

export const JOB_ANALYSIS_PROMPT = `You are an expert job posting analyzer. Extract structured information from job postings with high accuracy.

## Your Task
Parse the provided job posting content and extract:
1. Basic job details (title, company, location, employment type, salary)
2. A brief summary of the role
3. Key responsibilities
4. Required and preferred qualifications
5. Important keywords for ATS matching
6. Exact phrases to include in applications
7. Technologies and tools mentioned
8. Role categorization (family, industry, seniority)
9. Fit signals for matching

## Important Guidelines
- Extract ACTUAL text from the posting - do not invent details
- If information is not present, return null or empty arrays
- For keywords, focus on specific terms that would trigger ATS systems
- For ATS phrases, extract verbatim phrases from the job description
- Distinguish between required and preferred qualifications
- Note any signals about company culture or work style

## Fit Signal Analysis
Evaluate these dimensions based on the posting:
- AI/ML focus: Does the role involve AI products?
- Technical requirements: Does it require technical fluency?
- Workflow focus: Does it involve automation/workflow systems?
- Startup culture: Is this a startup environment?
- Engineering focus: Is this primarily an engineering role?
- People management: Does it require managing people?
- Product ownership: Level of product ownership expected

Be precise. The extracted data will be used for resume tailoring and fit scoring.`

const ROLE_FAMILY_OPTIONS = `- AI Technical Product Manager (AI products + technical depth)
- Technical Product Manager (technical products, systems, APIs)
- AI Product Manager (AI products, less technical)
- Product Manager (general product roles)
- Senior Product Manager (senior IC roles)
- Systems Product Manager (infrastructure, platform)
- Workflow Product Manager (automation, process)
- Analytics Product Manager (data, analytics products)
- Product Owner (scrum-focused)
- Program Manager (coordination, delivery)
- Other (doesn't fit above)`

export function buildJobAnalysisPrompt(pageContent: string): string {
  return `Analyze this job posting and extract structured information.

Be precise and extract only what is explicitly stated. Do not invent or assume information.

Role family options for categorization:
${ROLE_FAMILY_OPTIONS}

Job posting content:
${pageContent}

Extract the job details following the schema.`
}

// Schema is defined in the route file as it depends on zod
