/**
 * TruthSerum Core Utilities
 * Evidence-first, truth-locked generation system
 * 
 * This module provides:
 * 1. Evidence validation and blocking rules
 * 2. Generic language detection
 * 3. Bullet provenance tracking
 * 4. Score calculation with grounded metrics
 * 5. Strategy-aware generation rules
 */

import type { EvidenceRecord, Job } from "./types"
import type { EvidenceIntelligencePacket } from "./evidence/types"

// ============================================================================
// TYPES FOR TRUTH-LOCKED GENERATION
// ============================================================================

export type GenerationStrategy = 
  | "direct_match"      // Strong fit - can be assertive
  | "adjacent_transition" // Related experience - lean on nearby evidence
  | "stretch_honest"    // Weak fit - surface gaps, avoid overclaiming
  | "do_not_generate"   // Too risky - block export

export type EvidenceUsageRule = 
  | "active"           // Can use anywhere
  | "interview_only"   // Don't put in resume/cover letter
  | "cover_letter_only" // Only for cover letter, not resume bullets
  | "blocked"          // Never use
  | "unsupported"      // Needs verification before use

export type WorkflowStepStatus = 
  | "not_started"
  | "in_progress" 
  | "complete"
  | "warning"
  | "blocked"

export interface BulletProvenance {
  bullet_text: string
  source_evidence_id: string
  source_evidence_title: string
  source_role?: string
  source_company?: string
  matched_requirement_id?: string
  matched_requirement_text?: string
  source_packet_id?: string
  match_strength?: "strong" | "partial" | "weak"
  match_reason?: string
  evidence_strength?: "high" | "medium" | "low"
  proof_decision?: "auto_mapped" | "confirmed" | "skipped" | "needs_judgment"
  user_claim?: string | null
  proof_snippets?: string[]
  why_included?: string
  claim_confidence: "high" | "medium" | "low"
  keywords_covered: string[]
  risk_flags: string[]
  is_metric_rich: boolean
  concrete_signal_count: number
  truth_serum?: TruthSerumBulletAudit
}

export interface ParagraphProvenance {
  paragraph_text: string
  evidence_used: string[]
  matched_job_theme: string
  claim_confidence: "high" | "medium" | "low"
  unsupported_language: string[]
}

export interface ConfirmedProofUsage {
  packet_id: string
  requirement: string
  evidence_ids: string[]
  user_claim: string | null
  used: boolean
  used_in: Array<"resume" | "cover_letter">
  generated_claims: string[]
}


export interface RedTeamIssue {
  id: string
  type: "banned_phrase" | "vague_bullet" | "ai_filler" | "missing_metric" | "unsupported_claim" | "weak_concrete_signal"
  severity: "critical" | "warning" | "info"
  location: "resume" | "cover_letter"
  original_text: string
  issue_description: string
  suggested_fixes: RedTeamFix[]
}

export interface RedTeamFix {
  action: 
    | "rewrite_bullet" 
    | "swap_evidence" 
    | "add_metric" 
    | "remove_phrase" 
    | "make_concrete" 
    | "block_claim" 
    | "regenerate_section"
    // New auto-fix actions from profile knowledge
    | "auto_fix_from_profile"
    | "use_known_product_name"
    | "attach_known_repo"
    | "attach_known_website"
    | "use_stored_metric"
    | "request_missing_proof"
  label: string
  description: string
  canAutoFix?: boolean // Whether this fix can be applied automatically
  confidence?: "high" | "medium" | "low"
  sourceEvidence?: string // Evidence ID that supports this fix
}

export interface TruthSerumBulletAudit {
  generic: boolean
  ungrounded: boolean
  missing_system: boolean
  missing_scope: boolean
  missing_outcome: boolean
  flags: string[]
  score: number
}

// ============================================================================
// BANNED PHRASES AND GENERIC LANGUAGE DETECTION
// ============================================================================

// Tier 1: Phrases that indicate passive, ungrounded, or vague language.
// Score deduction applied — these replace specific accomplishments with weak claims.
export const GROUNDING_WEAK_PHRASES = [
  // Results/driven clichés
  "results driven",
  "results-driven",
  "outcome driven",
  "data driven professional",
  // Vague collaboration
  "collaborated with cross functional teams",
  "worked closely with",
  "partnered with stakeholders",
  // Meaningless traits
  "team player",
  "fast learner",
  // Vague impact
  "delivered value",
  "drive growth",
  "drove results",
  "moved the needle",
  "high quality products",
  "deliver impact",
  // Passive ownership hedging
  "responsible for",
  "helped with",
  "assisted in",
  "supported various",
  "worked on various",
  "participated in",
]

// Tier 2: Style suggestions — no score deduction.
// These are coaching hints shown in review but never flagged as penalties.
// Includes professional vocabulary common in PM, strategy, and leadership roles.
export const STYLE_SUGGESTION_PHRASES = [
  "I am excited to apply",
  "I would be thrilled",
  "passionate about",
  "leverage my skills",
  "hit the ground running",
  "think outside the box",
  "synergy",
  "dynamic environment",
  "fast-paced environment",
  "self-starter",
  "detail-oriented",
  "proven track record",
  "seasoned professional",
  "spearheaded initiatives",
  "at the end of the day",
  "circle back",
  "low-hanging fruit",
  "core competencies",
  "value-add",
  "best-in-class",
  "cutting-edge",
  "game-changer",
  "paradigm shift",
  "robust solution",
  "scalable solutions",
  // PM/strategy vocabulary — legitimate in PM roles, not a deficit
  "stakeholder alignment",
  "cross-functional collaboration",
  "strategic thinking",
  "thought leader",
]

// Backwards-compatible alias: returns only Tier 1 phrases (deduction-worthy).
export const BANNED_PHRASES = GROUNDING_WEAK_PHRASES

export const VAGUE_PATTERNS = [
  /improved\s+\w+\s+significantly/i,
  /increased\s+\w+\s+substantially/i,
  /enhanced\s+\w+\s+greatly/i,
  /various\s+\w+/i,
  /multiple\s+stakeholders/i,
  /several\s+teams/i,
  /many\s+projects/i,
  /numerous\s+initiatives/i,
  /key\s+initiatives/i,
  /strategic\s+initiatives/i,
]

/**
 * Detect banned phrases in text
 */
export function detectBannedPhrases(text: string): string[] {
  const lowerText = text.toLowerCase()
  const found: string[] = []

  for (const phrase of GROUNDING_WEAK_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      found.push(phrase)
    }
  }

  return found
}

/**
 * Detect Tier 2 style suggestion phrases (no score deduction — coaching hints only)
 */
export function detectStylePhrases(text: string): string[] {
  const lowerText = text.toLowerCase()
  return STYLE_SUGGESTION_PHRASES.filter(p => lowerText.includes(p.toLowerCase()))
}

/**
 * Detect vague patterns in text
 */
export function detectVaguePatterns(text: string): string[] {
  const found: string[] = []
  
  for (const pattern of VAGUE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      found.push(match[0])
    }
  }
  
  return found
}

/**
 * Check if a bullet has enough concrete signal
 * Concrete signal = at least 2 of: action, system/artifact, business context, result/metric
 */
export function analyzeBulletConcreteness(bullet: string): {
  has_action: boolean
  has_system: boolean
  has_context: boolean
  has_result: boolean
  concrete_signal_count: number
  is_concrete_enough: boolean
} {
  // Action verbs that indicate concrete work
  const actionVerbs = /^(led|built|shipped|launched|created|designed|implemented|deployed|migrated|integrated|reduced|increased|improved|automated|defined|owned|managed|developed|established|scaled)/i
  
  // Systems, tools, or artifacts
  const systemPatterns = /(api|platform|system|tool|feature|product|service|dashboard|pipeline|database|model|integration|sdk|cli|infrastructure)/i
  
  // Business context indicators
  const contextPatterns = /(for|serving|across|with|enabling|supporting)\s+(customers|users|partners|teams|enterprise|business|revenue)/i
  
  // Results with specificity (numbers, percentages, timeframes)
  const resultPatterns = /(\d+[%kKmM]?|\$\d+|[\d,]+\s*(users|customers|partners|requests|transactions)|reduced|increased|improved)\s+/i
  
  const has_action = actionVerbs.test(bullet.trim())
  const has_system = systemPatterns.test(bullet)
  const has_context = contextPatterns.test(bullet)
  const has_result = resultPatterns.test(bullet)
  
  const concrete_signal_count = [has_action, has_system, has_context, has_result].filter(Boolean).length
  
  return {
    has_action,
    has_system,
    has_context,
    has_result,
    concrete_signal_count,
    is_concrete_enough: concrete_signal_count >= 2
  }
}

/**
 * Check if bullet contains metrics
 */
export function hasMetrics(text: string): boolean {
  const metricPatterns = [
    /\d+%/,                    // Percentages
    /\$[\d,]+[kKmM]?/,         // Dollar amounts
    /[\d,]+\s*(users|customers|partners|resellers)/i,  // User counts
    /[\d,]+\s*(requests|transactions|outputs)/i,       // Volume metrics
    /\d+x\s/,                  // Multipliers
    /(reduced|increased|improved)\s+by\s+\d+/i,        // Delta metrics
    /\d+\s*(weeks?|months?|days?)\s+(to|from)/i,       // Time improvements
  ]
  
  return metricPatterns.some(p => p.test(text))
}

export function truthSerumAuditBullet(
  bullet: string,
  context: {
    sourceEvidenceId?: string | null
    proofSnippets?: string[]
    systems?: string[]
    tools?: string[]
    outcomes?: string[]
    riskFlags?: string[]
  } = {}
): TruthSerumBulletAudit {
  const concreteness = analyzeBulletConcreteness(bullet)
  const banned = detectBannedPhrases(bullet)
  const vague = detectVaguePatterns(bullet)
  const hasPacketSystems = Boolean(context.systems?.length || context.tools?.length)
  const hasPacketOutcomes = Boolean(context.outcomes?.length)
  const hasScope = /\b\d+|\bacross\b|\bglobal\b|\benterprise\b|\bregional\b|\bcountries\b|\busers\b|\bcustomers\b/i.test(bullet)
  const ungrounded = !context.sourceEvidenceId
  const generic = banned.length > 0 || vague.length > 0 || concreteness.concrete_signal_count < 2
  const missing_system = !concreteness.has_system && !hasPacketSystems
  const missing_outcome = !concreteness.has_result && !hasPacketOutcomes
  const missing_scope = !hasScope
  const flags = Array.from(new Set([
    ...banned.map(phrase => `banned_phrase:${phrase}`),
    ...vague.map(pattern => `vague_pattern:${pattern}`),
    ...(ungrounded ? ["ungrounded"] : []),
    ...(generic ? ["generic"] : []),
    ...(missing_system ? ["missing_system"] : []),
    ...(missing_scope ? ["missing_scope"] : []),
    ...(missing_outcome ? ["missing_outcome"] : []),
    ...(context.riskFlags ?? []),
  ]))
  const score = Math.max(
    0,
    100 -
      (ungrounded ? 30 : 0) -
      (generic ? 20 : 0) -
      (missing_system ? 10 : 0) -
      (missing_scope ? 10 : 0) -
      (missing_outcome ? 10 : 0)
  )
  return {
    generic,
    ungrounded,
    missing_system,
    missing_scope,
    missing_outcome,
    flags,
    score,
  }
}

export function buildConfirmedProofUsageReport(
  packets: EvidenceIntelligencePacket[],
  bulletProvenance: BulletProvenance[],
  paragraphProvenance: ParagraphProvenance[],
): ConfirmedProofUsage[] {
  const confirmedPackets = packets.filter((packet) => packet.proofDecision === "confirmed")

  return confirmedPackets.map((packet) => {
    const evidenceIds = new Set(packet.matchedEvidenceIds)
    const resumeClaims = bulletProvenance.filter((bullet) => {
      if (bullet.source_packet_id === packet.packet_id) return true
      return evidenceIds.has(bullet.source_evidence_id)
    })
    const coverLetterClaims = paragraphProvenance.filter((paragraph) =>
      paragraph.evidence_used.some((id) => evidenceIds.has(id)),
    )
    const usedIn: Array<"resume" | "cover_letter"> = []
    if (resumeClaims.length > 0) usedIn.push("resume")
    if (coverLetterClaims.length > 0) usedIn.push("cover_letter")

    return {
      packet_id: packet.packet_id,
      requirement: packet.requirement,
      evidence_ids: packet.matchedEvidenceIds,
      user_claim: packet.userClaim ?? null,
      used: usedIn.length > 0,
      used_in: usedIn,
      generated_claims: [
        ...resumeClaims.map((claim) => claim.bullet_text),
        ...coverLetterClaims.map((claim) => claim.paragraph_text),
      ],
    }
  })
}

// ============================================================================
// EVIDENCE VALIDATION AND BLOCKING
// ============================================================================

export interface EvidenceWithRules extends EvidenceRecord {
  usage_rule: EvidenceUsageRule
  blocked_reason?: string
}

/**
 * Get usage rule for evidence based on its properties
 */
export function getEvidenceUsageRule(evidence: EvidenceRecord): EvidenceUsageRule {
  // Check confidence level
  if (evidence.confidence_level === "low") {
    return "unsupported"
  }
  
  // Check visibility
  if (evidence.visibility_status === "archived" || evidence.visibility_status === "hidden") {
    return "blocked"
  }
  
  // Check if active
  if (!evidence.is_active) {
    return "blocked"
  }
  
  // Check what_not_to_overstate - if it mentions "interview only"
  if (evidence.what_not_to_overstate?.toLowerCase().includes("interview only")) {
    return "interview_only"
  }
  
  // Check what_not_to_overstate - if it mentions "cover letter only"
  if (evidence.what_not_to_overstate?.toLowerCase().includes("cover letter only")) {
    return "cover_letter_only"
  }
  
  return "active"
}

/**
 * Filter evidence for resume generation (excludes interview_only and cover_letter_only)
 */
export function filterEvidenceForResume(evidence: EvidenceRecord[]): EvidenceRecord[] {
  return evidence.filter(e => {
    const rule = getEvidenceUsageRule(e)
    return rule === "active"
  })
}

/**
 * Filter evidence for cover letter generation (excludes interview_only)
 */
export function filterEvidenceForCoverLetter(evidence: EvidenceRecord[]): EvidenceRecord[] {
  return evidence.filter(e => {
    const rule = getEvidenceUsageRule(e)
    return rule === "active" || rule === "cover_letter_only"
  })
}

// ============================================================================
// GENERATION STRATEGY DETERMINATION
// ============================================================================

/**
 * Determine generation strategy based on job fit and evidence coverage
 */
export function determineGenerationStrategy(
  job: Job,
  requiredCoverage: number,
  evidenceQuality: number
): { strategy: GenerationStrategy; reasoning: string } {
  const fitScore = job.score ?? null

  // Direct match: High fit + good coverage + quality evidence
  if (fitScore !== null && fitScore >= 80 && requiredCoverage >= 70 && evidenceQuality >= 70) {
    return {
      strategy: "direct_match",
      reasoning: `Strong fit (${fitScore}/100) with ${requiredCoverage}% requirement coverage. Can be assertive in claims.`
    }
  }

  // Adjacent transition: Medium fit or some coverage gaps
  if (fitScore !== null && fitScore >= 60 && requiredCoverage >= 50) {
    return {
      strategy: "adjacent_transition",
      reasoning: `Good fit (${fitScore}/100) but ${100 - requiredCoverage}% requirements need adjacent framing. Lean on transferable skills without claiming direct ownership.`
    }
  }

  // Stretch honest: Lower fit but still possible
  if ((fitScore !== null && fitScore >= 40) || requiredCoverage >= 30) {
    return {
      strategy: "stretch_honest",
      reasoning: `Stretch fit (${fitScore !== null ? `${fitScore}/100` : "unscored"}) with significant gaps. Surface gaps honestly, avoid overclaiming. Consider if worth pursuing.`
    }
  }

  // Do not generate: Too risky
  return {
    strategy: "do_not_generate",
    reasoning: fitScore === null
      ? `Score not available with only ${requiredCoverage}% coverage. Generating materials would require invention. Not recommended.`
      : `Poor fit (${fitScore}/100) with only ${requiredCoverage}% coverage. Generating materials would require invention. Not recommended.`
  }
}

// ============================================================================
// WORKFLOW STATUS CALCULATION
// ============================================================================

export interface WorkflowStatus {
  evidence_match: WorkflowStepStatus
  evidence_match_reason: string
  scoring: WorkflowStepStatus
  scoring_reason: string
  red_team: WorkflowStepStatus
  red_team_reason: string
  export_ready: WorkflowStepStatus
  export_reason: string
}

/**
 * Calculate workflow status for a job based on actual state
 */
export function calculateWorkflowStatus(
  job: Job,
  hasEvidenceMap: boolean,
  criticalIssueCount: number,
  truthScore: number,
  genericityPenalty: number
): WorkflowStatus {
  // Evidence Match status
  let evidenceMatchStatus: WorkflowStepStatus = "not_started"
  let evidenceMatchReason = "No evidence has been mapped to requirements yet"
  
  if (hasEvidenceMap) {
    const requiredCount = (job.qualifications_required || []).length
    const gaps = (job.score_gaps || []).length
    
    if (gaps > requiredCount * 0.3) {
      evidenceMatchStatus = "warning"
      evidenceMatchReason = `${gaps} requirements still have gaps`
    } else {
      evidenceMatchStatus = "complete"
      evidenceMatchReason = "Evidence mapped to all major requirements"
    }
  }
  
  // Scoring status
  let scoringStatus: WorkflowStepStatus = "not_started"
  let scoringReason = "Job has not been scored yet"
  
  if (job.score !== null) {
    if (truthScore < 60 || genericityPenalty > 15) {
      scoringStatus = "warning"
      scoringReason = truthScore < 60 
        ? `Truth score too low (${truthScore}%)`
        : `Genericity penalty too high (${genericityPenalty} pts)`
    } else {
      scoringStatus = "complete"
      scoringReason = `Scored at ${job.score}/100`
    }
  }
  
  // Red Team status
  let redTeamStatus: WorkflowStepStatus = "not_started"
  let redTeamReason = "Materials not yet reviewed for quality issues"
  
  if (job.generated_resume || job.generated_cover_letter) {
    if (criticalIssueCount > 0) {
      redTeamStatus = "blocked"
      redTeamReason = `${criticalIssueCount} critical issues must be fixed`
    } else if ((job.generation_quality_issues || []).length > 0) {
      redTeamStatus = "warning"
      redTeamReason = `${(job.generation_quality_issues || []).length} issues to review`
    } else {
      redTeamStatus = "complete"
      redTeamReason = "No quality issues detected"
    }
  }
  
  // Export status
  let exportStatus: WorkflowStepStatus = "not_started"
  let exportReason = "Complete all workflow steps to enable export"
  
  if (evidenceMatchStatus === "complete" && scoringStatus === "complete" && redTeamStatus === "complete") {
    exportStatus = "complete"
    exportReason = "Ready to export and apply"
  } else if (redTeamStatus === "blocked") {
    exportStatus = "blocked"
    exportReason = "Fix critical issues before exporting"
  } else if (evidenceMatchStatus === "warning" || scoringStatus === "warning" || redTeamStatus === "warning") {
    exportStatus = "warning"
    exportReason = "Review warnings before applying"
  }
  
  return {
    evidence_match: evidenceMatchStatus,
    evidence_match_reason: evidenceMatchReason,
    scoring: scoringStatus,
    scoring_reason: scoringReason,
    red_team: redTeamStatus,
    red_team_reason: redTeamReason,
    export_ready: exportStatus,
    export_reason: exportReason
  }
}

// ============================================================================
// RED TEAM ANALYSIS
// ============================================================================

/**
 * Perform comprehensive red team analysis on generated content
 */
export function performRedTeamAnalysis(
  resume: string,
  coverLetter: string,
  evidence: EvidenceRecord[]
): RedTeamIssue[] {
  const issues: RedTeamIssue[] = []
  let issueId = 0
  
  // Check resume for Tier 1 grounding-weak phrases (score impact)
  const resumeBannedPhrases = detectBannedPhrases(resume)
  for (const phrase of resumeBannedPhrases) {
    issues.push({
      id: `rt-${++issueId}`,
      type: "banned_phrase",
      severity: "warning",
      location: "resume",
      original_text: phrase,
      issue_description: `Passive phrase "${phrase}" weakens credibility — replace with a specific action and outcome.`,
      suggested_fixes: [
        { action: "remove_phrase", label: "Remove Phrase", description: "Delete this phrase entirely" },
        { action: "rewrite_bullet", label: "Rewrite", description: "Replace with specific, concrete language" }
      ]
    })
  }

  // Check resume for Tier 2 style phrases (coaching suggestions, no score impact)
  const resumeStylePhrases = detectStylePhrases(resume)
  for (const phrase of resumeStylePhrases) {
    issues.push({
      id: `rt-${++issueId}`,
      type: "banned_phrase",
      severity: "info",
      location: "resume",
      original_text: phrase,
      issue_description: `"${phrase}" is common professional language — consider grounding it with a specific example or outcome.`,
      suggested_fixes: [
        { action: "rewrite_bullet", label: "Add Context", description: "Pair with a concrete example from your evidence" }
      ]
    })
  }

  // Check cover letter for Tier 1 grounding-weak phrases
  const coverLetterBannedPhrases = detectBannedPhrases(coverLetter)
  for (const phrase of coverLetterBannedPhrases) {
    issues.push({
      id: `rt-${++issueId}`,
      type: "banned_phrase",
      severity: "warning",
      location: "cover_letter",
      original_text: phrase,
      issue_description: `Passive phrase "${phrase}" weakens your narrative — use direct, evidence-backed language.`,
      suggested_fixes: [
        { action: "remove_phrase", label: "Remove", description: "Delete and rephrase" },
        { action: "rewrite_bullet", label: "Rewrite", description: "Use direct, specific language" }
      ]
    })
  }

  // Check cover letter for Tier 2 style phrases
  const coverLetterStylePhrases = detectStylePhrases(coverLetter)
  for (const phrase of coverLetterStylePhrases) {
    issues.push({
      id: `rt-${++issueId}`,
      type: "banned_phrase",
      severity: "info",
      location: "cover_letter",
      original_text: phrase,
      issue_description: `"${phrase}" is standard professional language — strengthen it by grounding it in a specific story or result.`,
      suggested_fixes: [
        { action: "rewrite_bullet", label: "Ground It", description: "Tie to a specific project or outcome from your evidence" }
      ]
    })
  }
  
  // Check resume bullets for weak concrete signal
  const resumeBullets = resume
    .split("\n")
    .filter(line => line.trim().startsWith("-") || line.trim().startsWith("•"))
  
  for (const bullet of resumeBullets) {
    const analysis = analyzeBulletConcreteness(bullet)
    
    if (!analysis.is_concrete_enough) {
      issues.push({
        id: `rt-${++issueId}`,
        type: "weak_concrete_signal",
        severity: "warning",
        location: "resume",
        original_text: bullet.trim(),
        issue_description: `Bullet lacks concrete signal (only ${analysis.concrete_signal_count}/4). Missing: ${[
          !analysis.has_action && "action verb",
          !analysis.has_system && "system/artifact",
          !analysis.has_context && "business context",
          !analysis.has_result && "measurable result"
        ].filter(Boolean).join(", ")}`,
        suggested_fixes: [
          { action: "add_metric", label: "Add Metric", description: "Include a specific number or outcome" },
          { action: "make_concrete", label: "Add Specifics", description: "Add system name, team size, or business impact" },
          { action: "swap_evidence", label: "Use Different Evidence", description: "Replace with a more specific accomplishment" }
        ]
      })
    }
    
    // Check for missing metrics in achievement bullets
    if (!hasMetrics(bullet) && /led|shipped|built|launched|created/i.test(bullet)) {
      issues.push({
        id: `rt-${++issueId}`,
        type: "missing_metric",
        severity: "info",
        location: "resume",
        original_text: bullet.trim(),
        issue_description: "Achievement bullet has no quantifiable metric. Numbers make claims verifiable.",
        suggested_fixes: [
          { action: "add_metric", label: "Add Metric", description: "Add user count, percentage, or dollar amount if available in evidence" }
        ]
      })
    }
  }
  
  // Check for vague patterns
  const vagueInResume = detectVaguePatterns(resume)
  for (const vague of vagueInResume) {
    issues.push({
      id: `rt-${++issueId}`,
      type: "vague_bullet",
      severity: "warning",
      location: "resume",
      original_text: vague,
      issue_description: `Vague language pattern: "${vague}". Be specific about what, how much, or who.`,
      suggested_fixes: [
        { action: "make_concrete", label: "Be Specific", description: "Replace with exact numbers, names, or outcomes" }
      ]
    })
  }
  
  return issues
}
