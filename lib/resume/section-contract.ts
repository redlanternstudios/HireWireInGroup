export type ResumeSectionRole = "required" | "optional" | "omit_if_empty"

export type ResumeSectionDefinition = {
  key: string
  label: string
  role: ResumeSectionRole
  evidenceRequired?: boolean
  description: string
}

export const RESUME_SECTION_CONTRACT: ResumeSectionDefinition[] = [
  {
    key: "header",
    label: "Header",
    role: "required",
    description: "Name plus contact line. Always present.",
  },
  {
    key: "summary",
    label: "Professional Summary",
    role: "required",
    evidenceRequired: true,
    description: "2 to 3 sentences. Must be grounded in proven experience.",
  },
  {
    key: "experience",
    label: "Professional Experience",
    role: "required",
    evidenceRequired: true,
    description: "Role history with evidence linked bullets. No floating claim blocks.",
  },
  {
    key: "skills",
    label: "Core Competencies",
    role: "required",
    evidenceRequired: true,
    description: "Only skills supported by profile, evidence, or direct job fit.",
  },
  {
    key: "education",
    label: "Education",
    role: "optional",
    description: "Include only when present and relevant.",
  },
  {
    key: "certifications",
    label: "Certifications",
    role: "optional",
    description: "Include only when the user has real certifications.",
  },
  {
    key: "projects",
    label: "Projects",
    role: "optional",
    description: "Include only when there is real project evidence.",
  },
  {
    key: "links",
    label: "Links",
    role: "omit_if_empty",
    description: "Include only when there are real URLs worth showing.",
  },
]

export const REQUIRED_RESUME_SECTION_KEYS = RESUME_SECTION_CONTRACT
  .filter((section) => section.role === "required")
  .map((section) => section.key)

export const OPTIONAL_RESUME_SECTION_KEYS = RESUME_SECTION_CONTRACT
  .filter((section) => section.role === "optional")
  .map((section) => section.key)

export const OMIT_IF_EMPTY_RESUME_SECTION_KEYS = RESUME_SECTION_CONTRACT
  .filter((section) => section.role === "omit_if_empty")
  .map((section) => section.key)

export function buildResumeSectionContractText() {
  return RESUME_SECTION_CONTRACT
    .map((section) => `- ${section.label} [${section.role}]: ${section.description}`)
    .join("\n")
}

