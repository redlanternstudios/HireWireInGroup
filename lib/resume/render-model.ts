/**
 * Resume Render Model
 *
 * Abstraction layer between raw resume text and preview/export surfaces.
 * All preview and export paths must route through buildResumeRenderModel()
 * so that future template engines, branded layouts, and ATS variants
 * can be introduced without rewriting every consumer.
 *
 * V1: still plaintext internally — the model normalizes structure only.
 * Future: swap in structured section parsing, template rendering, etc.
 */

// ─── Source Attribution ───────────────────────────────────────────────────────

export type ResumeSourceAttribution = 'generated' | 'edited' | 'hybrid'

// ─── Section Model ────────────────────────────────────────────────────────────

export interface ResumeSection {
  heading: string | null
  lines: string[]
  isBulletGroup: boolean
}

// ─── Render Model ─────────────────────────────────────────────────────────────

export interface ResumeRenderModel {
  rawText: string
  sections: ResumeSection[]
  sourceAttribution: ResumeSourceAttribution
  resumeFormat: string
  resumeFont: string
  metadata: {
    jobId: string
    jobTitle: string
    company: string
    generatedAt: string | null
    editedAt: string | null
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export interface BuildRenderModelOptions {
  generatedResume: string | null
  editedResume: string | null
  resumeFormat: string
  resumeFont: string
  jobId: string
  jobTitle: string
  company: string
  generatedAt: string | null
  editedAt: string | null
}

export function buildResumeRenderModel(
  rawText: string,
  opts: BuildRenderModelOptions
): ResumeRenderModel {
  return {
    rawText,
    sections: parseIntoSections(rawText),
    sourceAttribution: deriveSourceAttribution(
      opts.generatedResume,
      opts.editedResume
    ),
    resumeFormat: opts.resumeFormat,
    resumeFont: opts.resumeFont,
    metadata: {
      jobId: opts.jobId,
      jobTitle: opts.jobTitle,
      company: opts.company,
      generatedAt: opts.generatedAt,
      editedAt: opts.editedAt,
    },
  }
}

// ─── Attribution Derivation ───────────────────────────────────────────────────

function deriveSourceAttribution(
  generatedResume: string | null,
  editedResume: string | null
): ResumeSourceAttribution {
  if (!editedResume) return 'generated'
  if (editedResume === generatedResume) return 'generated'
  return 'edited'
}

// ─── Section Parser ───────────────────────────────────────────────────────────

const SECTION_HEADINGS = new Set([
  'summary',
  'professional summary',
  'experience',
  'professional experience',
  'work experience',
  'skills',
  'technical skills',
  'core competencies',
  'education',
  'certifications',
  'projects',
  'selected projects',
  'achievements',
  'awards',
  'publications',
  'volunteer',
  'languages',
])

function parseIntoSections(rawText: string): ResumeSection[] {
  const lines = rawText.split('\n')
  const sections: ResumeSection[] = []
  let current: ResumeSection = { heading: null, lines: [], isBulletGroup: false }

  for (const line of lines) {
    const trimmed = line.trim()
    const isHeading = trimmed.length > 0 && SECTION_HEADINGS.has(trimmed.toLowerCase())
    const isBullet = /^[-*•]\s+/.test(trimmed)

    if (isHeading) {
      if (current.lines.length > 0 || current.heading !== null) {
        sections.push(current)
      }
      current = { heading: trimmed, lines: [], isBulletGroup: false }
    } else {
      if (isBullet) current.isBulletGroup = true
      current.lines.push(line)
    }
  }

  if (current.lines.length > 0 || current.heading !== null) {
    sections.push(current)
  }

  return sections
}
