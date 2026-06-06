/**
 * lib/intelligence/recruiter-scan.ts
 *
 * Phase 5: Recruiter Scan Report
 *
 * Purpose: Simulate the first 10-second recruiter scan of a generated resume.
 * Returns structured analysis of what a real recruiter would see, question,
 * and flag — with confidence levels and no fake certainty.
 *
 * This is NOT a match score.
 * It is a simulation of human pattern recognition.
 *
 * Consumed by:
 *  - Job details page (Recruiter Intelligence Panel)
 *  - Coach context (answering "what would a recruiter question?")
 *  - Application package preview
 */

import type { NarrativeModeProfile } from "./narrative-mode"
import type { ArchetypeProfile } from "./role-archetypes"
import type { JobSignalProfile } from "./job-signal-weights"

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecruiterSentiment = "strong" | "mixed" | "risky" | "unclear"

export interface RecruiterFinding {
  /** What the recruiter notices */
  observation: string
  /** What this means for the candidacy */
  implication: string
  sentiment: RecruiterSentiment
  /** 0–1 confidence this would actually be noticed */
  confidence: number
  /** Which part of the resume this relates to */
  section: "headline" | "summary" | "experience" | "skills" | "overall"
}

export interface RecruiterRiskFlag {
  risk: string
  severity: "critical" | "moderate" | "minor"
  mitigation: string | null
}

export interface RecruiterScanReport {
  job_id: string
  /** Overall 10-second impression */
  first_impression: string
  overall_sentiment: RecruiterSentiment
  /** 0–100 confidence the resume would proceed past first scan */
  pass_probability: number
  pass_probability_rationale: string
  findings: RecruiterFinding[]
  risk_flags: RecruiterRiskFlag[]
  /** What stands out in 10 seconds */
  standout_elements: string[]
  /** What creates friction or confusion */
  friction_elements: string[]
  /** What appears to be missing vs. the job */
  missing_signals: string[]
  /** Coaching recommendations based on scan */
  recommendations: string[]
  generated_at: string
}

// ─── Scan Generator ───────────────────────────────────────────────────────────

interface ScanInput {
  jobId: string
  resumeText: string
  candidateName: string | null
  jobTitle: string | null
  jobCompany: string | null
  archetypeProfile: ArchetypeProfile
  signalProfile: JobSignalProfile
  narrativeMode: NarrativeModeProfile
  fitScore: number | null
  qualityScore: number | null
  bulletTexts: string[]
  skillsList: string[]
  hasCoverLetter: boolean
  generationStrategy: "direct_match" | "adjacent_transition" | "stretch_honest" | "do_not_generate"
}

/**
 * Generate a recruiter scan report from resume outputs.
 * Rule-based analysis — deterministic, no extra AI call.
 * The report surfaces as a companion to every generated resume.
 */
export function generateRecruiterScanReport(input: ScanInput): RecruiterScanReport {
  const {
    jobId,
    resumeText,
    candidateName,
    jobTitle,
    jobCompany,
    archetypeProfile,
    signalProfile,
    narrativeMode,
    fitScore,
    qualityScore,
    bulletTexts,
    skillsList,
    hasCoverLetter,
    generationStrategy,
  } = input

  const findings: RecruiterFinding[] = []
  const riskFlags: RecruiterRiskFlag[] = []
  const standoutElements: string[] = []
  const frictionElements: string[] = []
  const missingSignals: string[] = []
  const recommendations: string[] = []

  // ── HEADLINE ANALYSIS ──────────────────────────────────────────────────────

  if (candidateName) {
    findings.push({
      observation: `Candidate name "${candidateName}" is present and readable`,
      implication: "Clean entry point — recruiter can immediately identify who this is",
      sentiment: "strong",
      confidence: 0.95,
      section: "headline",
    })
  } else {
    riskFlags.push({
      risk: "Candidate name missing or not parsed",
      severity: "critical",
      mitigation: "Ensure full name is in the profile before generating",
    })
  }

  // ── SUMMARY ANALYSIS ──────────────────────────────────────────────────────

  const summaryMatch = resumeText.match(/PROFESSIONAL SUMMARY\n([\s\S]*?)(?:\n\n[A-Z])/)?.[1]
  if (summaryMatch) {
    const summaryLength = summaryMatch.trim().split(" ").length

    if (summaryLength < 20) {
      findings.push({
        observation: "Summary is very brief",
        implication: "Recruiter won't get a clear picture of the candidate before scanning experience",
        sentiment: "risky",
        confidence: 0.82,
        section: "summary",
      })
      recommendations.push("Expand the summary to 2-3 sentences that position you for this specific role")
    } else if (summaryLength > 120) {
      findings.push({
        observation: "Summary is long — recruiters rarely read summaries this detailed",
        implication: "Risk of recruiter skipping straight to experience and missing the positioning",
        sentiment: "mixed",
        confidence: 0.75,
        section: "summary",
      })
      recommendations.push("Tighten the summary to 40–60 words — get to the point faster")
    } else {
      standoutElements.push("Summary is well-sized for recruiter scan")
    }

    // Check if summary references the target role archetype
    const archetypeTerms = archetypeProfile.ats_language.slice(0, 4)
    const summaryHasRelevantTerms = archetypeTerms.some(term =>
      summaryMatch.toLowerCase().includes(term.toLowerCase())
    )
    if (summaryHasRelevantTerms) {
      findings.push({
        observation: "Summary uses language aligned with this role type",
        implication: "Recruiter pattern-match probability increases for this archetype",
        sentiment: "strong",
        confidence: 0.80,
        section: "summary",
      })
      standoutElements.push("Summary uses archetype-aligned language")
    } else {
      frictionElements.push("Summary doesn't immediately signal the target role type")
      recommendations.push(`Add role-specific language to your summary (e.g., ${archetypeTerms.slice(0, 2).join(", ")})`)
    }
  } else {
    riskFlags.push({
      risk: "Professional summary not detected in resume",
      severity: "moderate",
      mitigation: "A summary is the recruiter's first positioning signal — don't skip it",
    })
  }

  // ── BULLET ANALYSIS ────────────────────────────────────────────────────────

  const bulletsWithMetrics = bulletTexts.filter(b =>
    /\d+/.test(b) && (/\%|million|billion|k\b|x\b|hours|days|weeks|users|customers/i.test(b))
  )
  const bulletsWithActionVerbs = bulletTexts.filter(b =>
    /^[•\-]?\s*(Built|Led|Launched|Shipped|Grew|Reduced|Improved|Created|Designed|Architected|Managed|Scaled|Automated|Delivered|Drove|Implemented|Developed|Deployed|Established|Increased)/i.test(b)
  )

  if (bulletsWithMetrics.length >= 3) {
    standoutElements.push(`${bulletsWithMetrics.length} bullets include quantified outcomes`)
    findings.push({
      observation: `${bulletsWithMetrics.length} of ${bulletTexts.length} bullets contain measurable outcomes`,
      implication: "Strong concreteness signal — recruiter can visualize scope and impact",
      sentiment: "strong",
      confidence: 0.88,
      section: "experience",
    })
  } else if (bulletsWithMetrics.length === 0) {
    frictionElements.push("No bullets with measurable outcomes detected")
    riskFlags.push({
      risk: "Zero quantified outcomes in experience bullets",
      severity: "moderate",
      mitigation: "Add real numbers from evidence where available; use qualitative scope when metrics aren't available",
    })
  }

  if (bulletsWithActionVerbs.length < bulletTexts.length * 0.6) {
    frictionElements.push("Several bullets don't start with strong action verbs")
    recommendations.push("Rewrite passive bullets to start with action verbs (Built, Led, Shipped, Automated)")
  } else {
    standoutElements.push("Bullets use strong action verbs consistently")
  }

  // ── SKILLS ANALYSIS ────────────────────────────────────────────────────────

  const topJobKeywords = signalProfile.ats_priority_keywords.slice(0, 8)
  const matchedSkills = topJobKeywords.filter(kw =>
    skillsList.some(s => s.toLowerCase().includes(kw.toLowerCase())) ||
    resumeText.toLowerCase().includes(kw.toLowerCase())
  )

  const skillCoverage = topJobKeywords.length > 0 ? matchedSkills.length / topJobKeywords.length : 0

  if (skillCoverage >= 0.6) {
    standoutElements.push(`${Math.round(skillCoverage * 100)}% of top ATS keywords present`)
    findings.push({
      observation: `Strong keyword alignment with job signals`,
      implication: "ATS and initial keyword scan will likely pass — resume matches role language",
      sentiment: "strong",
      confidence: 0.85,
      section: "skills",
    })
  } else if (skillCoverage < 0.3) {
    frictionElements.push("Low ATS keyword match for this role type")
    riskFlags.push({
      risk: `Only ${Math.round(skillCoverage * 100)}% of expected role keywords detected`,
      severity: "critical",
      mitigation: `Add these terms to your skills or bullets where truthfully applicable: ${topJobKeywords.filter(k => !matchedSkills.includes(k)).slice(0, 3).join(", ")}`,
    })
  }

  // Check for missing signals based on archetype expectations
  for (const expectedType of archetypeProfile.preferred_evidence_types.slice(0, 2)) {
    if (expectedType === "shipped_product" && !resumeText.toLowerCase().includes("launch") && !resumeText.toLowerCase().includes("shipped") && !resumeText.toLowerCase().includes("built")) {
      missingSignals.push("No clear 'shipped product' signal — recruiters expect this for your archetype")
    }
  }

  // ── STRATEGY RISK ──────────────────────────────────────────────────────────

  if (generationStrategy === "stretch_honest") {
    riskFlags.push({
      risk: "This is a stretch application — recruiter may notice gaps",
      severity: "moderate",
      mitigation: "Your cover letter should directly address the most visible gaps with honest framing",
    })
    frictionElements.push("Stretch application — some signals may be thinner than ideal")
  } else if (generationStrategy === "adjacent_transition") {
    findings.push({
      observation: "Application involves a role transition",
      implication: "Recruiter will be scanning for transferable signal — ensure the summary explains the transition",
      sentiment: "mixed",
      confidence: 0.78,
      section: "overall",
    })
  }

  // ── FIT SCORE CONTEXT ──────────────────────────────────────────────────────

  if (fitScore !== null) {
    if (fitScore >= 75) {
      standoutElements.push(`High match score (${fitScore}/100) — strong candidate alignment`)
    } else if (fitScore < 45) {
      frictionElements.push(`Lower match score (${fitScore}/100) — some requirements may not be covered`)
      recommendations.push("Review the gaps identified in your evidence match report before applying")
    }
  }

  // ── QUALITY SCORE ──────────────────────────────────────────────────────────

  if (qualityScore !== null && qualityScore < 70) {
    riskFlags.push({
      risk: "Quality score below threshold — potential banned phrases or weak bullets detected",
      severity: "moderate",
      mitigation: "Review quality issues flagged in the generation report and edit before applying",
    })
  }

  // ── COVER LETTER ──────────────────────────────────────────────────────────

  if (!hasCoverLetter) {
    recommendations.push("Add a cover letter — it differentiates you when experience is similar to other candidates")
  }

  // ── FIRST IMPRESSION & PASS PROBABILITY ────────────────────────────────────

  const strongCount = findings.filter(f => f.sentiment === "strong").length
  const riskyCount = findings.filter(f => f.sentiment === "risky").length + riskFlags.filter(r => r.severity === "critical").length
  const mixedCount = findings.filter(f => f.sentiment === "mixed").length

  let passProbability = 50
  passProbability += strongCount * 8
  passProbability -= riskyCount * 12
  passProbability -= mixedCount * 3
  passProbability = Math.max(10, Math.min(92, passProbability))

  const overallSentiment: RecruiterSentiment =
    passProbability >= 70 ? "strong" :
    passProbability >= 50 ? "mixed" :
    riskFlags.some(r => r.severity === "critical") ? "risky" : "unclear"

  const firstImpression = buildFirstImpression(overallSentiment, archetypeProfile, standoutElements, frictionElements)

  return {
    job_id: jobId,
    first_impression: firstImpression,
    overall_sentiment: overallSentiment,
    pass_probability: passProbability,
    pass_probability_rationale: `Based on ${findings.length} scan findings: ${strongCount} strong, ${mixedCount} mixed, ${riskyCount} risk signals`,
    findings,
    risk_flags: riskFlags,
    standout_elements: standoutElements,
    friction_elements: frictionElements,
    missing_signals: missingSignals,
    recommendations,
    generated_at: new Date().toISOString(),
  }
}

function buildFirstImpression(
  sentiment: RecruiterSentiment,
  archetype: ArchetypeProfile,
  standouts: string[],
  friction: string[]
): string {
  const roleType = archetype.archetype

  switch (sentiment) {
    case "strong":
      return `Strong ${roleType} candidate profile. ${standouts[0] || "Clear alignment with role signals"}. Likely to proceed past initial scan.`
    case "mixed":
      return `Plausible ${roleType} candidate with mixed signals. ${standouts[0] || "Some role alignment present"}, but ${friction[0] || "some friction exists"}. Could advance with a strong cover letter.`
    case "risky":
      return `${roleType} application with notable gaps. ${friction[0] || "Key signals are unclear"}. Risk of early filter unless the cover letter addresses positioning directly.`
    case "unclear":
      return `Positioning for this ${roleType} role is ambiguous from a 10-second scan. The summary and headline need to make the fit more obvious to the recruiter.`
  }
}
