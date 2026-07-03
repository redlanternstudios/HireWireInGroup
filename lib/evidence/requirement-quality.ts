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
