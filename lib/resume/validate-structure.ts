/**
 * Resume Structure Validation
 *
 * Pre-export integrity check. Called before any DOCX, TXT, or print export.
 * Catches structural problems that produce malformed output silently.
 *
 * This is the v1 ATS defense layer. Future additions:
 * - unsupported unicode character detection
 * - hallucinated template artifact detection
 * - claim/evidence mismatch warnings (requires evidence_map)
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
      checks: { hasContent: false, hasName: false, hasContact: false, hasSections: false },
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
  const knownSections = ['experience', 'skills', 'education', 'summary', 'certifications', 'projects']
  const hasSections = knownSections.some(k => allText.includes(k))
  if (!hasSections) warnings.push('No standard resume sections detected — ATS parsing may fail')

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
    checks: { hasContent, hasName, hasContact, hasSections },
  }
}
