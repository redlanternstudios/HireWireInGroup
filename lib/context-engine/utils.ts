import type { Confidence } from "./types"

export const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "your", "you",
  "our", "are", "was", "were", "has", "have", "had", "will", "can", "may",
  "job", "role", "team", "work", "using", "across", "within", "about",
])

export function nowIso() {
  return new Date().toISOString()
}

export function stableId(prefix: string, parts: Array<string | number | null | undefined>) {
  const input = parts.filter((part) => part !== null && part !== undefined).join("|").toLowerCase()
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i)
    hash &= 0xffffffff
  }
  return `${prefix}_${Math.abs(hash).toString(36)}`
}

export function normalizeText(value: string) {
  return value
    .replace(/[^\w#+./%$-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function canonicalize(value: string) {
  return normalizeText(value).toLowerCase()
}

export function tokenize(value: string) {
  return canonicalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values))
}

export function confidenceFromScore(score: number): Confidence {
  if (score >= 0.75) return "high"
  if (score >= 0.45) return "medium"
  return "low"
}

export function overlapScore(left: string, right: string) {
  const a = new Set(tokenize(left))
  const b = new Set(tokenize(right))
  if (a.size === 0 || b.size === 0) return 0
  let hits = 0
  for (const token of a) if (b.has(token)) hits++
  return hits / Math.min(a.size, b.size)
}

export function extractMetrics(text: string) {
  const patterns = [
    /\b\d[\d,]*(?:\.\d+)?\s*(?:%|percent|x|k|m|b|users?|customers?|countries|markets|teams?|people|months?|years?|hours?|days?)\b/gi,
    /\$[\d,]+(?:\.\d+)?\s*(?:k|m|b)?/gi,
  ]
  return unique(patterns.flatMap((pattern) => text.match(pattern) ?? [])).map((match) => match.trim())
}

export function splitSentences(text: string) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 2)
}

export function includesAny(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.some((term) => lower.includes(term.toLowerCase()))
}

export function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim().length > 0)?.trim() ?? ""
}
