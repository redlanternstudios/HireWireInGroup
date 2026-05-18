export type EvidenceDuplicateRow = {
  id?: string
  source_type?: string | null
  source_title?: string | null
  role_name?: string | null
  company_name?: string | null
  date_range?: string | null
  responsibilities?: string[] | null
  tools_used?: string[] | null
  outcomes?: string[] | null
  proof_snippet?: string | null
}

export type EvidenceDuplicateCandidate = {
  incoming: EvidenceDuplicateRow
  existing: EvidenceDuplicateRow
  confidence: number
  reasons: string[]
}

export type EvidenceDuplicateGroup = {
  group_id: string
  confidence: number
  reasons: string[]
  incoming: EvidenceDuplicateRow
  matches: EvidenceDuplicateRow[]
}

const HIGH_CONFIDENCE = 0.82
const MEDIUM_CONFIDENCE = 0.68

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenSet(value: unknown) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 2))
}

function jaccard(left: unknown, right: unknown) {
  const a = tokenSet(left)
  const b = tokenSet(right)
  if (a.size === 0 && b.size === 0) return 0
  const intersection = [...a].filter((token) => b.has(token)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : intersection / union
}

function overlap(left?: string[] | null, right?: string[] | null) {
  const a = new Set((left ?? []).map(normalize).filter(Boolean))
  const b = new Set((right ?? []).map(normalize).filter(Boolean))
  if (a.size === 0 || b.size === 0) return 0
  const intersection = [...a].filter((item) => b.has(item)).length
  return intersection / Math.min(a.size, b.size)
}

function combinedText(row: EvidenceDuplicateRow) {
  return [
    row.source_title,
    row.role_name,
    row.company_name,
    row.date_range,
    row.proof_snippet,
    ...(row.responsibilities ?? []),
    ...(row.outcomes ?? []),
    ...(row.tools_used ?? []),
  ].filter(Boolean).join(" ")
}

function exactish(left?: string | null, right?: string | null) {
  const a = normalize(left)
  const b = normalize(right)
  return a.length > 0 && b.length > 0 && a === b
}

export function scoreEvidenceDuplicate(
  incoming: EvidenceDuplicateRow,
  existing: EvidenceDuplicateRow,
): EvidenceDuplicateCandidate | null {
  const reasons: string[] = []
  let score = 0

  if (incoming.source_type && existing.source_type && incoming.source_type === existing.source_type) {
    score += 0.1
    reasons.push("same evidence type")
  }

  const titleSimilarity = Math.max(
    jaccard(incoming.source_title, existing.source_title),
    jaccard(incoming.role_name, existing.role_name),
  )
  if (titleSimilarity >= 0.75 || exactish(incoming.source_title, existing.source_title)) {
    score += 0.3
    reasons.push("similar title or role")
  } else if (titleSimilarity >= 0.45) {
    score += 0.16
    reasons.push("partially similar title or role")
  }

  if (exactish(incoming.company_name, existing.company_name)) {
    score += 0.2
    reasons.push("same company or project")
  } else if (jaccard(incoming.company_name, existing.company_name) >= 0.6) {
    score += 0.12
    reasons.push("similar company or project")
  }

  if (exactish(incoming.date_range, existing.date_range)) {
    score += 0.15
    reasons.push("same date range")
  }

  const toolsOverlap = overlap(incoming.tools_used, existing.tools_used)
  if (toolsOverlap >= 0.5) {
    score += 0.1
    reasons.push("overlapping tools or skills")
  }

  const textSimilarity = jaccard(combinedText(incoming), combinedText(existing))
  if (textSimilarity >= 0.45) {
    score += 0.15
    reasons.push("similar responsibilities or outcomes")
  } else if (textSimilarity >= 0.25) {
    score += 0.08
    reasons.push("partially similar details")
  }

  const confidence = Math.min(1, Number(score.toFixed(2)))
  if (confidence < MEDIUM_CONFIDENCE) return null

  return { incoming, existing, confidence, reasons }
}

export function detectEvidenceDuplicates(
  incomingRows: EvidenceDuplicateRow[],
  existingRows: EvidenceDuplicateRow[],
): EvidenceDuplicateGroup[] {
  return incomingRows
    .map((incoming, index) => {
      const matches = existingRows
        .map((existing) => scoreEvidenceDuplicate(incoming, existing))
        .filter((candidate): candidate is EvidenceDuplicateCandidate => !!candidate)
        .sort((a, b) => b.confidence - a.confidence)

      if (matches.length === 0) return null

      const best = matches[0]
      return {
        group_id: `evidence-duplicate-${index}`,
        confidence: best.confidence,
        reasons: Array.from(new Set(matches.flatMap((match) => match.reasons))),
        incoming,
        matches: matches.map((match) => match.existing),
      }
    })
    .filter((group): group is EvidenceDuplicateGroup => !!group)
    .filter((group) => group.confidence >= HIGH_CONFIDENCE || group.matches.length > 1)
}

export function mergeStringArrays(...values: Array<string[] | null | undefined>) {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const value of values) {
    for (const item of value ?? []) {
      const clean = String(item).trim()
      const key = normalize(clean)
      if (!clean || seen.has(key)) continue
      seen.add(key)
      merged.push(clean)
    }
  }
  return merged
}
