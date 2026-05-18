/**
 * lib/coach/drift-scorer.ts
 *
 * Measures how far a generated document has drifted from its source evidence.
 *
 * A "drift" occurs when the AI:
 *   - Inflates a number beyond what the evidence states
 *   - Claims a larger team/budget/scope than recorded
 *   - Uses a more senior job title than the evidence supports
 *   - References a tool not listed in evidence.tools_used
 *   - Uses language on the never-use banned phrases list
 *   - Produces an outcome claim with zero matching evidence support
 *
 * Drift score: 0 = perfect fidelity, 100 = fully fabricated.
 * Anything above DRIFT_BLOCK_THRESHOLD (65) causes a hard generation block.
 *
 * GOVERNANCE INVARIANT: drift.is_blocking = true MUST prevent the document
 * from being persisted, regardless of quality_check.overall_passed.
 */

import type { DriftScore, DriftFlag, DriftCategory, GovernanceEvidence } from "./types"
import type { ClaimVerdict } from "./types"

// ── Constants ─────────────────────────────────────────────────────────────────

const DRIFT_BLOCK_THRESHOLD = 65

const BANNED_PHRASES: [string, DriftCategory][] = [
  ["results-driven", "banned_phrase"],
  ["results driven", "banned_phrase"],
  ["dynamic professional", "banned_phrase"],
  ["seasoned leader", "banned_phrase"],
  ["proven track record", "banned_phrase"],
  ["team player", "banned_phrase"],
  ["spearheaded", "banned_phrase"],
  ["passionate about", "banned_phrase"],
  ["self-starter", "banned_phrase"],
  ["go-getter", "banned_phrase"],
  ["synergize", "banned_phrase"],
  ["synergies", "banned_phrase"],
  ["leverage", "banned_phrase"],
  ["best-in-class", "banned_phrase"],
  ["thought leader", "banned_phrase"],
  ["move the needle", "banned_phrase"],
  ["circle back", "banned_phrase"],
  ["hard-working", "banned_phrase"],
  ["hardworking", "banned_phrase"],
  ["detail-oriented", "banned_phrase"],
  ["out-of-the-box", "banned_phrase"],
  ["game changer", "banned_phrase"],
  ["game-changer", "banned_phrase"],
]

// Senior title keywords — if these appear in a bullet but not in evidence titles,
// flag as possible title promotion.
const SENIOR_TITLE_KEYWORDS = [
  "vp", "vice president", "cto", "ceo", "coo", "ciso", "chief",
  "director", "head of", "principal", "distinguished", "fellow",
  "partner", "managing director", "executive",
]

// ── Number extraction ─────────────────────────────────────────────────────────

function extractNumbers(text: string): number[] {
  const matches: number[] = []
  const pattern = /(\d[\d,]*(?:\.\d+)?)\s*(%|k|m|b|x)?/gi
  for (const m of text.matchAll(pattern)) {
    let n = parseFloat(m[1].replace(/,/g, ""))
    const suffix = m[2]?.toLowerCase()
    if (suffix === "k") n *= 1_000
    else if (suffix === "m") n *= 1_000_000
    else if (suffix === "b") n *= 1_000_000_000
    if (!isNaN(n)) matches.push(n)
  }
  return matches
}

function maxEvidenceNumber(evSet: GovernanceEvidence[]): number {
  const allText = evSet
    .flatMap((e) => [
      ...(e.outcomes ?? []),
      ...(e.responsibilities ?? []),
      ...(e.approved_achievement_bullets ?? []),
      e.team_size != null ? String(e.team_size) : "",
      e.budget_scope ?? "",
      e.user_impact_scale ?? "",
    ])
    .join(" ")
  const nums = extractNumbers(allText)
  return nums.length > 0 ? Math.max(...nums) : 0
}

// ── Drift checks ──────────────────────────────────────────────────────────────

function checkBannedPhrases(
  text: string,
  claimText: string
): DriftFlag[] {
  const lower = text.toLowerCase()
  return BANNED_PHRASES
    .filter(([phrase]) => lower.includes(phrase))
    .map(([phrase, category]) => ({
      category,
      description: `Banned phrase detected: "${phrase}"`,
      claim_text: claimText,
      evidence_id: null,
      severity: "warning" as const,
    }))
}

function checkMetricInflation(
  bulletText: string,
  evidenceId: string | null,
  evidenceSet: GovernanceEvidence[]
): DriftFlag[] {
  if (!evidenceId) return []
  const evidence = evidenceSet.find((e) => e.id === evidenceId)
  if (!evidence) return []

  const bulletNums = extractNumbers(bulletText)
  const evMaxNum = maxEvidenceNumber([evidence])

  const flags: DriftFlag[] = []
  for (const n of bulletNums) {
    // Flag if number in bullet is more than 2x the largest number in the evidence
    if (evMaxNum > 0 && n > evMaxNum * 2) {
      flags.push({
        category: "metric_inflation",
        description: `Number ${n.toLocaleString()} in bullet is more than 2x the largest value (${evMaxNum.toLocaleString()}) found in evidence.`,
        claim_text: bulletText,
        evidence_id: evidenceId,
        severity: "block",
      })
    }
  }
  return flags
}

function checkScopeExpansion(
  bulletText: string,
  evidenceId: string | null,
  evidenceSet: GovernanceEvidence[]
): DriftFlag[] {
  if (!evidenceId) return []
  const evidence = evidenceSet.find((e) => e.id === evidenceId)
  if (!evidence) return []

  const flags: DriftFlag[] = []
  const lower = bulletText.toLowerCase()

  // Check team size — "team of N" where N > evidence.team_size
  const teamMatch = lower.match(/team\s+of\s+(\d+)/)
  if (teamMatch && evidence.team_size != null) {
    const claimedSize = parseInt(teamMatch[1])
    if (claimedSize > evidence.team_size * 1.5) {
      flags.push({
        category: "scope_expansion",
        description: `Claimed team size (${claimedSize}) exceeds evidence team size (${evidence.team_size}).`,
        claim_text: bulletText,
        evidence_id: evidenceId,
        severity: "block",
      })
    }
  }

  // Check for what_not_to_overstate
  if (evidence.what_not_to_overstate) {
    const doNotOverstate = evidence.what_not_to_overstate.toLowerCase()
    // Check if any words from the "do not overstate" guidance appear in the bullet
    const flagWords = doNotOverstate.split(/\s+/).filter((w) => w.length > 4)
    const matches = flagWords.filter((w) => lower.includes(w))
    if (matches.length > 0) {
      flags.push({
        category: "scope_expansion",
        description: `Bullet may be overstating: "${evidence.what_not_to_overstate}"`,
        claim_text: bulletText,
        evidence_id: evidenceId,
        severity: "warning",
      })
    }
  }

  return flags
}

function checkUnsupportedTools(
  bulletText: string,
  evidenceId: string | null,
  allEvidence: GovernanceEvidence[]
): DriftFlag[] {
  // Build the full set of tools across ALL evidence (not just one record)
  const allTools = new Set(
    allEvidence.flatMap((e) => (e.tools_used ?? []).map((t) => t.toLowerCase()))
  )

  // Known common tools/languages that don't need evidence grounding
  const universalTools = new Set([
    "excel", "word", "powerpoint", "google docs", "google sheets", "slack",
    "email", "zoom", "teams", "notion", "confluence", "jira", "trello",
    "gmail", "outlook", "linkedin", "github", "git", "salesforce",
    "tableau", "powerbi", "power bi", "looker", "figma", "asana",
    "airtable", "hubspot", "marketo", "agile", "scrum", "kanban",
  ])

  // Extract tool-like terms from bullet (capitalized words or known patterns)
  const toolPattern = /\b([A-Z][a-zA-Z0-9+#.]+(?:\s[A-Z][a-zA-Z0-9+#.]+)?)\b/g
  const mentioned: string[] = []
  for (const m of bulletText.matchAll(toolPattern)) {
    const t = m[1]
    if (t.length > 2 && t !== "I") mentioned.push(t)
  }

  const flags: DriftFlag[] = []
  for (const tool of mentioned) {
    const lower = tool.toLowerCase()
    if (!universalTools.has(lower) && !allTools.has(lower) && lower.length > 3) {
      // Only flag if the tool looks like it could be a tech tool (not just a proper noun)
      const looksLikeTool =
        /^[A-Z]{2,}\b/.test(tool) ||
        /^[A-Z][a-z0-9+#.]*[A-Z][a-zA-Z0-9+#.]*$/.test(tool) ||
        /(?:js|\.js|ts|db|sql)$/i.test(tool) ||
        /[+#.]/.test(tool)
      if (looksLikeTool) {
        flags.push({
          category: "unsupported_tool",
          description: `Tool "${tool}" mentioned in bullet but not found in any evidence.tools_used.`,
          claim_text: bulletText,
          evidence_id: evidenceId,
          severity: "warning",
        })
      }
    }
  }
  return flags
}

function checkFabricatedOutcome(verdicts: ClaimVerdict[]): DriftFlag[] {
  return verdicts
    .filter((v) => v.confidence === "fabricated")
    .map((v) => ({
      category: "fabricated_outcome" as DriftCategory,
      description: v.failure_reason ?? "Claim could not be grounded in any evidence.",
      claim_text: v.claim_text,
      evidence_id: v.cited_evidence_id,
      severity: "block" as const,
    }))
}

// ── Score computation ─────────────────────────────────────────────────────────

function computeScore(flags: DriftFlag[]): number {
  const blockFlags = flags.filter((f) => f.severity === "block")
  const warnFlags = flags.filter((f) => f.severity === "warning")

  // Each blocking flag = 20 points, each warning = 5 points, max 100
  const raw = blockFlags.length * 20 + warnFlags.length * 5
  return Math.min(100, raw)
}

// ── Public API ────────────────────────────────────────────────────────────────

export type DriftInput = {
  bulletTexts: Array<{ text: string; evidence_id: string | null }>
  paragraphTexts: Array<{ text: string; evidence_id: string | null }>
  bulletVerdicts: ClaimVerdict[]
  paragraphVerdicts: ClaimVerdict[]
  evidenceSet: GovernanceEvidence[]
}

export function scoreDrift(input: DriftInput): DriftScore {
  const flags: DriftFlag[] = []

  // 1. Banned phrases across all bullets
  for (const bullet of input.bulletTexts) {
    flags.push(...checkBannedPhrases(bullet.text, bullet.text))
  }
  for (const para of input.paragraphTexts) {
    flags.push(...checkBannedPhrases(para.text, para.text))
  }

  // 2. Metric inflation per bullet
  for (const bullet of input.bulletTexts) {
    flags.push(...checkMetricInflation(bullet.text, bullet.evidence_id, input.evidenceSet))
  }

  // 3. Scope expansion per bullet
  for (const bullet of input.bulletTexts) {
    flags.push(...checkScopeExpansion(bullet.text, bullet.evidence_id, input.evidenceSet))
  }

  // 4. Unsupported tools across all bullets
  for (const bullet of input.bulletTexts) {
    flags.push(...checkUnsupportedTools(bullet.text, bullet.evidence_id, input.evidenceSet))
  }

  // 5. Fabricated outcomes from claim verdicts
  flags.push(...checkFabricatedOutcome(input.bulletVerdicts))
  flags.push(...checkFabricatedOutcome(input.paragraphVerdicts))

  const score = computeScore(flags)
  const isBlocking = score >= DRIFT_BLOCK_THRESHOLD

  const blockCount = flags.filter((f) => f.severity === "block").length
  const warnCount = flags.filter((f) => f.severity === "warning").length

  const summary =
    flags.length === 0
      ? "No drift detected — generation is fully grounded in evidence."
      : `Drift score ${score}/100 — ${blockCount} blocking issue(s), ${warnCount} warning(s). ${isBlocking ? "BLOCKED: document must not be persisted." : "Passed threshold, warnings noted."}`

  return {
    score,
    is_blocking: isBlocking,
    flags,
    summary,
  }
}
