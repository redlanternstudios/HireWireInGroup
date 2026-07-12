import {
  OMIT_IF_EMPTY_RESUME_SECTION_KEYS,
  OPTIONAL_RESUME_SECTION_KEYS,
  REQUIRED_RESUME_SECTION_KEYS,
} from "@/lib/resume/section-contract"

/**
 * Resume Structure Validation
 *
 * Pre-export integrity check. Called before any DOCX, TXT, or print export.
 * Catches structural problems that produce malformed output silently.
 *
 * This validator now follows one canonical resume contract:
 * required sections must exist, optional sections may exist, and omitted
 * sections stay out of the output when they are unsupported.
 */

export interface ResumeValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  checks: {
    hasContent: boolean
    hasName: boolean
    hasContact: boolean
    hasSections: boolean
    requiredSections: boolean
    optionalSections: string[]
  }
}

export function validateResumeStructure(rawText: string): ResumeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!rawText || !rawText.trim()) {
    return {
      valid: false,
      errors: ['Resume content is empty'],
      warnings: [],
      checks: {
        hasContent: false,
        hasName: false,
        hasContact: false,
        hasSections: false,
        requiredSections: false,
        optionalSections: [],
      },
    }
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const allText = rawText.toLowerCase()

  // Content length
  const hasContent = rawText.trim().length > 100
  if (!hasContent) errors.push('Resume content is too short to export')

  // Name detection: first non-empty line, under 80 chars, no @ symbol
  const firstLine = lines[0] ?? ''
  const hasName = firstLine.length > 0 && firstLine.length < 80 && !firstLine.includes('@')
  if (!hasName) warnings.push('Could not detect a candidate name on the first line')

  // Contact info: email or phone pattern
  const hasContact = /@\w/.test(rawText) || /\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(rawText)
  if (!hasContact) warnings.push('No email address or phone number detected')

  // Section headings
  const allSectionKeys = [
    ...REQUIRED_RESUME_SECTION_KEYS,
    ...OPTIONAL_RESUME_SECTION_KEYS,
    ...OMIT_IF_EMPTY_RESUME_SECTION_KEYS,
  ]
  const requiredSections = REQUIRED_RESUME_SECTION_KEYS.every((key) => allText.includes(key))
  const optionalSections = OPTIONAL_RESUME_SECTION_KEYS.filter((key) => allText.includes(key))
  const hasSections = allSectionKeys.some(k => allText.includes(k))

  if (!requiredSections) {
    errors.push(`Missing required resume sections: ${REQUIRED_RESUME_SECTION_KEYS.filter((key) => !allText.includes(key)).join(", ")}`)
  }
  if (!hasSections) warnings.push('No standard resume sections detected — ATS parsing may fail')
  if (OPTIONAL_RESUME_SECTION_KEYS.length > 0 && optionalSections.length === 0) {
    warnings.push('Optional sections were omitted because there was not enough evidence to support them')
  }

  // Accidental markdown syntax
  if (/^#{1,6}\s/m.test(rawText)) {
    warnings.push('Markdown heading syntax (###) detected — will appear as literal text in DOCX')
  }
  if (/\*\*[^*\n]+\*\*/.test(rawText)) {
    warnings.push('Markdown bold syntax (**text**) detected — will appear as literal text in DOCX')
  }

  // Excessive blank lines (formatting artifact)
  if (/\n{6,}/.test(rawText)) {
    warnings.push('Large spacing gaps detected — may produce unexpected whitespace in export')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks: { hasContent, hasName, hasContact, hasSections, requiredSections, optionalSections },
  }
}
