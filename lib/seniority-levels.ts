/**
 * Seniority Level Extraction and Comparison
 *
 * Parses role titles and job descriptions to extract implied seniority levels
 * and compares requirements against user evidence with semantic understanding.
 *
 * Seniority hierarchy:
 * - Entry: Junior, Associate, Intern
 * - IC/Mid: "title" (no prefix/modifier, 3-5 YOE range)
 * - Senior IC: Senior title, Staff (high IC)
 * - Lead: Lead title, managing people or major scope (director-track)
 * - Director+: Director, VP, C-Level
 */

export type SeniorityLevel = "entry" | "mid" | "senior_ic" | "lead" | "director_plus" | "unknown"

export interface SeniorityAnalysis {
  implied_level: SeniorityLevel
  confidence: "high" | "medium" | "low"
  matched_keywords: string[]
  reasoning: string
}

export interface SeniorityComparison {
  requirement_level: SeniorityLevel
  evidence_level: SeniorityLevel
  matches: boolean
  gap_type: "none" | "seniority_gap_up" | "seniority_gap_down" | "unclear"
  explanation: string
}

const ENTRY_KEYWORDS = new Set([
  "junior",
  "associate",
  "intern",
  "entry",
  "graduate",
  "apprentice",
  "trainee",
])

const MID_KEYWORDS = new Set([
  // Explicitly mid-level
  "specialist",
  "coordinator",
  "analyst",
  "engineer",
  "product manager",
  "pm",
  "po",
  "product owner",
  // These imply mid when alone (no Lead/Senior prefix)
  "developer",
  "designer",
  "manager",
])

const SENIOR_IC_KEYWORDS = new Set([
  "senior",
  "staff",
  "principal",
  "tech lead",
  "architect",
  "lead engineer",
  "lead designer",
  "expert",
  "specialist",
])

const LEAD_KEYWORDS = new Set([
  "lead",
  "manager",
  "lead product manager",
  "lead pm",
  "product lead",
  "team lead",
  "scrum master",
  "agile coach",
])

const DIRECTOR_KEYWORDS = new Set([
  "director",
  "vp",
  "vice president",
  "chief",
  "cto",
  "cfo",
  "ceo",
  "president",
  "head of",
  "general manager",
])

const MANAGEMENT_KEYWORDS = new Set([
  "lead",
  "manage",
  "director",
  "lead",
  "oversee",
  "supervise",
  "coordinate",
  "head",
])

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim()
}

function tokenizeTitle(title: string): string[] {
  return normalizeTitle(title)
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

/**
 * Detect if a requirement text implies leadership/direction
 */
function hasLeadershipImplication(text: string): boolean {
  const normalized = normalizeTitle(text)
  return (
    LEAD_KEYWORDS.has(normalized) ||
    Array.from(MANAGEMENT_KEYWORDS).some((keyword) => normalized.includes(keyword)) ||
    /lead|manage|direct|oversee|supervise|head of/.test(normalized)
  )
}

/**
 * Extract seniority level from a role title
 */
export function extractSeniorityLevel(title: string): SeniorityAnalysis {
  if (!title || typeof title !== "string") {
    return {
      implied_level: "unknown",
      confidence: "low",
      matched_keywords: [],
      reasoning: "Empty or invalid title",
    }
  }

  const tokens = tokenizeTitle(title)
  const normalized = normalizeTitle(title)
  const matchedKeywords: string[] = []

  // Check for director/VP level
  for (const keyword of Array.from(DIRECTOR_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      matchedKeywords.push(keyword)
      return {
        implied_level: "director_plus",
        confidence: "high",
        matched_keywords: matchedKeywords,
        reasoning: `Found director-level keyword: "${keyword}"`,
      }
    }
  }

  // Check for lead level (but not if just "lead engineer" without management context)
  const hasLeadKeyword = Array.from(LEAD_KEYWORDS).some((k) => normalized.includes(k))
  const isLeadWithTeamContext =
    hasLeadKeyword &&
    (hasLeadershipImplication(title) ||
      /people|team|group|organization|org/.test(normalized))

  if (isLeadWithTeamContext) {
    matchedKeywords.push(...Array.from(LEAD_KEYWORDS).filter((k) => normalized.includes(k)))
    return {
      implied_level: "lead",
      confidence: "high",
      matched_keywords: matchedKeywords,
      reasoning: `Found lead/management keyword with team context: "${title}"`,
    }
  }

  // Check for senior IC
  for (const keyword of Array.from(SENIOR_IC_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      matchedKeywords.push(keyword)
      return {
        implied_level: "senior_ic",
        confidence: "high",
        matched_keywords: matchedKeywords,
        reasoning: `Found senior IC keyword: "${keyword}"`,
      }
    }
  }

  // Check for entry level
  for (const keyword of Array.from(ENTRY_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      matchedKeywords.push(keyword)
      return {
        implied_level: "entry",
        confidence: "high",
        matched_keywords: matchedKeywords,
        reasoning: `Found entry-level keyword: "${keyword}"`,
      }
    }
  }

  // Check for mid-level (requires more heuristics)
  const hasMidKeyword = Array.from(MID_KEYWORDS).some((k) => normalized.includes(k))
  if (hasMidKeyword) {
    // If it has "senior" or "lead" prefix, it's senior IC, not mid
    const hasSeniorPrefix = Array.from(SENIOR_IC_KEYWORDS).some((k) => normalized.includes(k))
    if (!hasSeniorPrefix) {
      matchedKeywords.push(...Array.from(MID_KEYWORDS).filter((k) => normalized.includes(k)))
      return {
        implied_level: "mid",
        confidence: "high",
        matched_keywords: matchedKeywords,
        reasoning: `Found mid-level keywords: ${matchedKeywords.join(", ")}`,
      }
    }
  }

  // Fallback: if title contains "product manager", assume mid
  if (/product manager|pm\b/.test(normalized)) {
    return {
      implied_level: "mid",
      confidence: "medium",
      matched_keywords: ["product_manager"],
      reasoning: "Contains 'product manager' but no seniority modifier; assuming mid-level",
    }
  }

  return {
    implied_level: "unknown",
    confidence: "low",
    matched_keywords: [],
    reasoning: `Could not determine seniority level from: "${title}"`,
  }
}

/**
 * Compare requirement seniority against evidence seniority
 */
export function compareSeniorityLevels(
  requirementText: string,
  evidenceTitle: string,
): SeniorityComparison {
  const req = extractSeniorityLevel(requirementText)
  const ev = extractSeniorityLevel(evidenceTitle)

  const levelOrder: SeniorityLevel[] = ["entry", "mid", "senior_ic", "lead", "director_plus"]
  const reqIdx = levelOrder.indexOf(req.implied_level)
  const evIdx = levelOrder.indexOf(ev.implied_level)

  const matches = req.implied_level === ev.implied_level
  let gap_type: "none" | "seniority_gap_up" | "seniority_gap_down" | "unclear" = "none"
  let explanation = ""

  if (!matches) {
    if (reqIdx === -1 || evIdx === -1) {
      gap_type = "unclear"
      explanation = `Could not determine seniority levels clearly (req: ${req.implied_level}, ev: ${ev.implied_level})`
    } else if (reqIdx > evIdx) {
      gap_type = "seniority_gap_up"
      explanation = `Requirement is higher seniority (${req.implied_level}) than evidence (${ev.implied_level})`
    } else {
      gap_type = "seniority_gap_down"
      explanation = `Evidence shows higher seniority (${ev.implied_level}) than requirement (${req.implied_level}); could be overqualified`
    }
  } else {
    explanation = `Seniority levels match: both ${req.implied_level}`
  }

  return {
    requirement_level: req.implied_level,
    evidence_level: ev.implied_level,
    matches,
    gap_type,
    explanation,
  }
}

/**
 * Generate coaching guidance based on seniority comparison
 */
export function generateSeniorityGuidance(
  requirementText: string,
  evidenceTitle: string,
): { should_probe_leadership: boolean; guidance: string } {
  const comparison = compareSeniorityLevels(requirementText, evidenceTitle)

  if (comparison.gap_type === "seniority_gap_up") {
    return {
      should_probe_leadership: true,
      guidance: `The requirement implies "${comparison.requirement_level}" level responsibility, but the evidence shows "${comparison.evidence_level}" level experience. Ask about leadership, direction-setting, or scope expansion that bridges this gap.`,
    }
  }

  if (comparison.gap_type === "seniority_gap_down") {
    return {
      should_probe_leadership: false,
      guidance: `The evidence shows more seniority than required. This is likely fine—the user is probably overqualified or transitioning down. Confirm the experience is still relevant.`,
    }
  }

  if (comparison.gap_type === "unclear") {
    return {
      should_probe_leadership: false,
      guidance: `Seniority levels are unclear. Ask about scope, team size managed, or autonomy level to clarify.`,
    }
  }

  return {
    should_probe_leadership: false,
    guidance: `Seniority levels appear to match. Ask for specific examples and outcomes.`,
  }
}
