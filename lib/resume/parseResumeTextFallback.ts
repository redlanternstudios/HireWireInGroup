import type { ParsedResume, ParsedWorkExperience } from "@/lib/mapResumeToEvidence"

const SECTION_NAMES = [
  "summary",
  "portfolio",
  "experience",
  "product skills",
  "technical skills",
  "education",
  "certifications",
]

function normalizeLines(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function isSectionHeader(line: string) {
  return SECTION_NAMES.includes(line.toLowerCase())
}

function collectSection(lines: string[], name: string) {
  const start = lines.findIndex((line) => line.toLowerCase() === name.toLowerCase())
  if (start === -1) return []

  const out: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (isSectionHeader(line)) break
    out.push(line)
  }
  return out
}

function splitCommaList(lines: string[]) {
  return Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/,| \u00b7 /))
        .map((item) => item.trim())
        .filter((item) => item.length > 1)
    )
  )
}

function parseContact(lines: string[]) {
  const email = lines.join(" ").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null
  const phone = lines.join(" ").match(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/)?.[0] ?? null
  const location = lines.find((line) => /,\s*[A-Z]{2}\b/.test(line))?.split("|")[0]?.trim() ?? null

  return {
    full_name: lines[0] ?? null,
    email,
    phone,
    location,
    website_url: lines.join(" ").match(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\b/i)?.[0] ?? null,
    linkedin_url: lines.join(" ").match(/\blinkedin\.com\/[^\s|]+/i)?.[0] ?? null,
  }
}

function parseExperience(lines: string[]) {
  const experience = collectSection(lines, "experience")
  const roles: ParsedWorkExperience[] = []
  let current: ParsedWorkExperience | null = null

  for (const line of experience) {
    const roleMatch = line.match(/^(.+?)[\u2014-]\s*(.+?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).*)$/i)
    if (roleMatch) {
      if (current) roles.push(current)
      current = {
        role: roleMatch[1].trim(),
        company: roleMatch[2].trim(),
        date_range: roleMatch[3].trim(),
        responsibilities: [],
        tools_used: [],
        outcomes: [],
      }
      continue
    }

    if (!current) continue
    if (line.startsWith("-") || line.startsWith("•")) {
      const bullet = line.replace(/^[-•]\s*/, "").trim()
      current.responsibilities?.push(bullet)
      if (/\d|%|countries|platform|launched|shipped|reduced|deployed/i.test(bullet)) {
        current.outcomes?.push(bullet)
      }
    }
  }

  if (current) roles.push(current)
  return roles
}

function parseEducation(lines: string[]) {
  const education = collectSection(lines, "education")
  const rows = []

  for (let index = 0; index < education.length; index += 3) {
    const degree = education[index]
    const school = education[index + 1]
    const dateRange = education[index + 2]
    if (!degree || !school) continue
    rows.push({
      degree,
      school,
      field: undefined,
      date_range: /\d{4}/.test(dateRange ?? "") ? dateRange : undefined,
      honors: undefined,
    })
  }

  return rows
}

function parseCertifications(lines: string[]) {
  return collectSection(lines, "certifications")
    .filter((line) => !/rory semeah/i.test(line))
    .map((name) => ({ name, issuer: undefined, date: undefined }))
}

function parseProjects(lines: string[]) {
  const portfolio = collectSection(lines, "portfolio")
  const names = ["By Red OS", "HireWire", "Authentic Hadith"]
  return names
    .filter((name) => portfolio.some((line) => line.includes(name)))
    .map((name) => ({
      name,
      description: portfolio.join(" ").slice(0, 500),
      tech_stack: splitCommaList(portfolio.filter((line) => /^Stack:/i.test(line)).map((line) => line.replace(/^Stack:\s*/i, ""))),
      outcomes: undefined,
      url: portfolio.find((line) => line.includes(".")) ?? undefined,
    }))
}

export function parseResumeTextFallback(text: string): ParsedResume {
  const lines = normalizeLines(text)
  const contact = parseContact(lines)
  const summaryLines = collectSection(lines, "summary")
  const skillLines = [
    ...collectSection(lines, "product skills"),
    ...collectSection(lines, "technical skills"),
  ]
  const skills = splitCommaList(skillLines)

  return {
    work_experience: parseExperience(lines),
    education: parseEducation(lines),
    skills,
    tools: skills,
    domains: skills.filter((skill) => /AI|SaaS|SAP|workflow|enterprise|cloud|automation/i.test(skill)),
    certifications: parseCertifications(lines),
    projects: parseProjects(lines),
    full_name: contact.full_name ?? undefined,
    email: contact.email ?? undefined,
    phone: contact.phone ?? undefined,
    location: contact.location ?? undefined,
    summary: summaryLines.join(" ") || undefined,
    linkedin_url: contact.linkedin_url ?? undefined,
    github_url: undefined,
    website_url: contact.website_url ?? undefined,
  }
}
