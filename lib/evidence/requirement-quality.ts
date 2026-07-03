const BOILERPLATE_PATTERNS = [
  /\bback to jobs\b/i,
  /\bsee this and similar jobs\b/i,
  /\bjob application for\b/i,
  /\bapply now\b/i,
  /\bprivacy policy\b/i,
  /\bterms of use\b/i,
  /\bsign in\b/i,
  /\bcreate job alert\b/i,
  /\bequal opportunity employer\b/i,
]

function normalizeText(value: string) {
  return value
    .replace(/^[\s•*–—-]+/, "")
    .replace(/\s+/g, " ")
    .trim()
}

// UI/status strings and posting scaffolding that leak into extracted
// requirements. These are NOT requirements and must never count toward fit.
const UI_STATUS_LEAKS = new Set([
  "package review",
  "analyze needed",
  "ready to generate",
  "ready to apply",
  "back to jobs",
  "prove fit",
  "match interview",
  "in progress",
])

/**
 * True only for UNAMBIGUOUS non-requirements: posting headlines ("X is hiring a
 * Y"), leaked UI status strings, and lines that are empty once numeric-id
 * pollution is stripped. Deliberately conservative — a real requirement that
 * merely carries an appended id (e.g. "Own ERP migrations 1779675718093") is
 * NOT boilerplate; it should be kept (and its id stripped elsewhere).
 */
export function isBoilerplateRequirement(value: unknown): boolean {
  if (typeof value !== "string") return true
  const text = normalizeText(value)
  const lower = text.toLowerCase()
  if (/\bis hiring\b/.test(lower)) return true
  // Strip standalone long numeric ids, collapse, and re-check what remains.
  const stripped = lower.replace(/\b\d{5,}\b/g, "").replace(/\s+/g, " ").trim()
  if (stripped.length < 6) return true
  if (UI_STATUS_LEAKS.has(stripped)) return true
  return false
}

/**
 * Strips DECORATION pollution from a real requirement's text: standalone long
 * numeric ids (e.g. "Own ERP migrations 1779675718093") and leading
 * qualification-label prefixes ("Required qualifications: ..."). Safe for
 * display; does not drop the requirement. Returns the cleaned string (falls
 * back to the trimmed original if cleaning would empty it).
 */
export function normalizeRequirementText(value: unknown): string {
  if (typeof value !== "string") return ""
  const cleaned = value
    .replace(/^\s*(required|preferred|basic|minimum)\s+qualifications:?\s*/i, "")
    .replace(/\b\d{5,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim()
  return cleaned.length >= 3 ? cleaned : normalizeText(value)
}

export function isActionableRequirementText(value: unknown): value is string {
  if (typeof value !== "string") return false

  const text = normalizeText(value)
  const words = text.split(/\s+/).filter(Boolean)

  if (text.length < 8 || text.length > 280) return false
  if (words.length < 2 || words.length > 45) return false
  if (/https?:\/\//i.test(text)) return false
  if (BOILERPLATE_PATTERNS.some((pattern) => pattern.test(text))) return false

  return true
}

export function sanitizeRequirementList(values: unknown, limit = 20): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (!isActionableRequirementText(value)) continue
    const normalized = normalizeText(value)
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
    if (result.length >= limit) break
  }

  return result
}

export function sanitizeKeywordList(values: unknown, limit = 30): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (typeof value !== "string") continue
    const normalized = normalizeText(value)
    const words = normalized.split(/\s+/).filter(Boolean)
    if (normalized.length < 2 || normalized.length > 100) continue
    if (words.length > 10) continue
    if (BOILERPLATE_PATTERNS.some((pattern) => pattern.test(normalized))) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
    if (result.length >= limit) break
  }

  return result
}
