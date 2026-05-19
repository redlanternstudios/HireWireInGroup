/**
 * lib/evidence/matchRequirementToEvidence.ts
 *
 * Matches a job requirement against a user's evidence library to find the best
 * supporting experience. Uses semantic similarity (keyword overlap) to score
 * each evidence record and return the highest-scoring match with its ID and
 * match quality score.
 */

/** Evidence record from evidence_library table */
export interface Evidence {
  id: string
  user_id: string
  title: string
  company_name?: string
  description?: string
  achievements?: string[]
  skills_demonstrated?: string[]
  tools_used?: string[]
  [key: string]: unknown
}

export interface RequirementMatch {
  /** Evidence ID of the best match, or null if no match found */
  evidenceId: string | null
  /** Semantic similarity score between requirement and evidence (0–1) */
  matchScore: number
  /** The matched evidence record, or null if no match found */
  evidence: Evidence | null
}

/**
 * Extract keywords from text for similarity scoring.
 * Lowercases, splits on non-alphanumeric boundaries, removes stopwords.
 */
function extractKeywords(text: string): Set<string> {
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "be", "have", "has", "do",
    "does", "i", "you", "he", "she", "it", "we", "they", "this", "that",
    "as", "can", "will", "would", "could", "should", "may", "might", "must",
  ])

  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !stopwords.has(w))

  return new Set(words)
}

/**
 * Calculate Jaccard similarity between two keyword sets.
 * Returns 0–1 score representing overlap.
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

/**
 * Match a requirement string against evidence records.
 * Returns the best match with similarity score, or null if no evidence provided.
 *
 * @param requirement — Job requirement text (e.g. "5+ years of AWS architecture")
 * @param evidenceSet — Array of evidence records to match against
 * @returns RequirementMatch with evidenceId, matchScore, and full evidence record
 */
export function matchRequirementToEvidence(
  requirement: string,
  evidenceSet: Evidence[]
): RequirementMatch {
  if (!evidenceSet || evidenceSet.length === 0) {
    return { evidenceId: null, matchScore: 0, evidence: null }
  }

  const reqKeywords = extractKeywords(requirement)

  if (reqKeywords.size === 0) {
    // Requirement has no meaningful keywords — return null match
    return { evidenceId: null, matchScore: 0, evidence: null }
  }

  let bestScore = 0
  let bestEvidence: Evidence | null = null

  for (const evidence of evidenceSet) {
    // Score evidence by combining multiple fields for semantic richness
    const combinedText = [
      evidence.title,
      evidence.company_name,
      evidence.description,
      evidence.achievements?.join(" "),
      evidence.skills_demonstrated?.join(" "),
      evidence.tools_used?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")

    const evidenceKeywords = extractKeywords(combinedText)
    const score = jaccardSimilarity(reqKeywords, evidenceKeywords)

    if (score > bestScore) {
      bestScore = score
      bestEvidence = evidence
    }
  }

  return {
    evidenceId: bestEvidence?.id ?? null,
    matchScore: bestScore,
    evidence: bestEvidence,
  }
}
