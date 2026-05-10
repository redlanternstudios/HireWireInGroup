<<<<<<< HEAD
// Coach deterministic renderer stub
import { CoachOutput, Claim, ArtifactType } from "./types"

export function renderArtifact(claims: Claim[], artifact_type: ArtifactType, version: string): CoachOutput {
  // TODO: Implement deterministic rendering logic per RENDERING_RULES.md
  // For now, return a stub with joined claim text
  const rendered = claims.map(c => `- ${c.text}`).join("\n")
  return {
    claims,
    artifact_type,
    version,
    rendered,
    quality: { passed: true, hardFails: [], warnings: [] },
  }
=======
/**
 * lib/coach/renderer.ts
 *
 * Structured document renderer for HireWire's governance layer.
 *
 * Converts provenance-bearing generation output into:
 *   - A StructuredResume (with bullets + evidence_ids)
 *   - A StructuredCoverLetter (with paragraphs + evidence_ids)
 *
 * The renderer enforces:
 *   - No orphan bullets (bullets without a cited evidence_id are flagged)
 *   - No empty sections
 *   - Consistent ATS-safe formatting
 *   - No unicode box-drawing characters
 *
 * GOVERNANCE INVARIANT: The renderer does NOT generate content. It only
 * formats what the AI produced. If a bullet has no evidence_id, it is
 * rendered with a flag — it is NOT silently discarded.
 */

import type { StructuredResume, StructuredCoverLetter } from "./types"

// ── Types accepted by the renderer ───────────────────────────────────────────

export type BulletInput = {
  bullet_text: string
  source_evidence_id: string | null
  source_role?: string
  source_company?: string
  keywords_used?: string[]
}

export type ExperienceInput = {
  title: string
  company: string
  start_date?: string
  end_date?: string
  bullets: BulletInput[]
}

export type ResumeInput = {
  candidate_name: string
  target_role: string
  contact: string
  summary: string
  experiences: ExperienceInput[]
  skills: string[]
  education: Array<{
    degree: string
    school: string
    year?: string
  }>
  projects_section?: string
}

export type CoverLetterInput = {
  candidate_name: string
  candidate_email?: string
  candidate_phone?: string
  paragraphs: Array<{
    paragraph_text: string
    evidence_ids_used: string[]
  }>
}

// ── Render resume ─────────────────────────────────────────────────────────────

export function renderResume(input: ResumeInput): {
  formatted: string
  structured: StructuredResume
  orphanBullets: BulletInput[]
} {
  const orphanBullets: BulletInput[] = []

  const allBullets: StructuredResume["bullets"] = []

  // Build experience section text
  const experienceLines: string[] = []
  for (const exp of input.experiences) {
    const dateRange = [exp.start_date, exp.end_date].filter(Boolean).join(" – ")
    const header = [exp.title, exp.company, dateRange].filter(Boolean).join("  |  ")
    experienceLines.push(header)

    for (const bullet of exp.bullets) {
      const line = `• ${bullet.bullet_text.trim()}`
      experienceLines.push(line)

      if (!bullet.source_evidence_id) {
        orphanBullets.push(bullet)
      }

      allBullets.push({
        text: bullet.bullet_text,
        evidence_id: bullet.source_evidence_id,
      })
    }
    experienceLines.push("") // blank line between roles
  }

  const skillsLine = input.skills.join(", ")

  const educationLines = input.education.map(
    (e) => `${e.degree}, ${e.school}${e.year ? ` (${e.year})` : ""}`
  )

  // ATS-safe plain text format — no unicode box-drawing
  const formatted = [
    input.candidate_name.toUpperCase(),
    `  ${input.target_role}`,
    `  ${input.contact}`,
    "",
    "PROFESSIONAL SUMMARY",
    input.summary,
    "",
    "PROFESSIONAL EXPERIENCE",
    ...experienceLines,
    ...(input.projects_section
      ? ["", input.projects_section]
      : []),
    "CORE COMPETENCIES",
    skillsLine,
    "",
    "EDUCATION",
    ...educationLines,
  ]
    .join("\n")
    .trim()

  const sections = [
    { label: "PROFESSIONAL SUMMARY", content: input.summary },
    { label: "PROFESSIONAL EXPERIENCE", content: experienceLines.join("\n").trim() },
    { label: "CORE COMPETENCIES", content: skillsLine },
    { label: "EDUCATION", content: educationLines.join("\n") },
  ].filter((s) => s.content.trim().length > 0)

  const structured: StructuredResume = {
    header: {
      name: input.candidate_name,
      headline: input.target_role,
      contact: input.contact,
    },
    summary: input.summary,
    sections,
    bullets: allBullets,
  }

  return { formatted, structured, orphanBullets }
}

// ── Render cover letter ───────────────────────────────────────────────────────

export function renderCoverLetter(input: CoverLetterInput): {
  formatted: string
  structured: StructuredCoverLetter
} {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const signatureParts = [
    input.candidate_name || "Candidate",
    input.candidate_phone ? `Direct: ${input.candidate_phone}` : null,
    input.candidate_email || null,
  ].filter(Boolean) as string[]

  const bodyText = input.paragraphs
    .map((p) => p.paragraph_text.trim())
    .filter(Boolean)
    .join("\n\n")

  const formatted = [
    today,
    "",
    "Dear Hiring Manager,",
    "",
    bodyText,
    "",
    "Sincerely,",
    "",
    signatureParts.join("\n"),
  ].join("\n")

  const structured: StructuredCoverLetter = {
    date: today,
    salutation: "Dear Hiring Manager,",
    paragraphs: input.paragraphs.map((p) => ({
      text: p.paragraph_text,
      evidence_ids: p.evidence_ids_used,
    })),
    closing: "Sincerely,",
    signature: signatureParts.join("\n"),
  }

  return { formatted, structured }
}

// ── Orphan bullet reporter ────────────────────────────────────────────────────

/**
 * Summarizes orphan bullets for inclusion in the quality issues array.
 * Does NOT remove them — they are flagged for human review.
 */
export function describeOrphanBullets(orphans: BulletInput[]): string[] {
  return orphans.map(
    (b) =>
      `ORPHAN BULLET (no evidence ID): "${b.bullet_text.slice(0, 80)}${b.bullet_text.length > 80 ? "..." : ""}"`
  )
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
}
