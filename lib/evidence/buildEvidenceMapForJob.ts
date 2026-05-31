import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CanonicalJobEvidenceMap,
  EvidenceAllowedUsage,
  EvidenceCoverageSummary,
  EvidenceIntelligencePacket,
  RequirementEvidenceMatch,
  RequirementPriority,
} from "./types"
import { matchRequirementToEvidence } from "./matchRequirementToEvidence"
import { normalizeRequirement } from "./normalizeRequirement"
import { applyAutoMappedProofDecisions, isMatchingComplete } from "./proofCoverage"
import { getEvidenceUsageRule } from "@/lib/truthserum"
import { buildJobContext } from "@/lib/context-engine"

type BuildEvidenceMapParams = {
  supabase: SupabaseClient
  userId: string
  jobId: string
}

type RequirementInput = {
  id?: string
  text: string
  normalized?: string
  priority: RequirementPriority
  expectationType?: string
  employerIntent?: string
  recoveryQuestion?: string
  proofNeeded?: string[]
  evidenceQuestions?: string[]
  relatedSkills?: string[]
  seniorityLevel?: string | null
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === "string") : []
}

function buildCoverageSummary(matches: RequirementEvidenceMatch[]): EvidenceCoverageSummary {
  return {
    required_total: matches.filter(m => m.priority === "required").length,
    required_met: matches.filter(m => m.priority === "required" && m.status === "met").length,
    required_partial: matches.filter(m => m.priority === "required" && m.status === "partial").length,
    required_gaps: matches.filter(m => m.priority === "required" && m.proof_decision !== "skipped" && (m.status === "gap" || m.status === "unknown")).length,
    preferred_total: matches.filter(m => m.priority === "preferred").length,
    preferred_met: matches.filter(m => m.priority === "preferred" && m.status === "met").length,
    keyword_total: matches.filter(m => m.priority === "keyword").length,
    keyword_met: matches.filter(m => m.priority === "keyword" && m.status === "met").length,
  }
}

function priorityFromImportance(importance: string | undefined): RequirementPriority {
  if (importance === "medium") return "preferred"
  if (importance === "low") return "keyword"
  return "required"
}

function buildRequirementInputs(
  analysis: Record<string, unknown> | null,
  job: Record<string, unknown> | null
): RequirementInput[] {
  const jobContext = buildJobContext({
    jobId: typeof job?.id === "string" ? job.id : undefined,
    jobText: typeof job?.job_description === "string" ? job.job_description : "",
    title: typeof job?.role_title === "string" ? job.role_title : null,
    company: typeof job?.company_name === "string" ? job.company_name : null,
    requirements: safeArray(analysis?.qualifications_required),
    responsibilities: safeArray(analysis?.responsibilities),
    keywords: safeArray(analysis?.keywords),
  })

  if (jobContext.requirements.length > 0) {
    return jobContext.requirements.map((requirement): RequirementInput => ({
      id: requirement.id,
      text: requirement.requirement_text,
      normalized: requirement.normalized_requirement,
      priority: priorityFromImportance(requirement.importance),
      expectationType: requirement.category,
      employerIntent: requirement.evidence_from_job_post,
      proofNeeded: [
        `Specific proof that supports: ${requirement.normalized_requirement}`,
        "Ownership, scope, systems, stakeholders, constraints, and outcomes where available.",
      ],
      evidenceQuestions: [
        `What real project, responsibility, or result shows ${requirement.normalized_requirement}?`,
        "What was your role, who was involved, and what changed because of your work?",
      ],
      recoveryQuestion: `What real project, responsibility, or result shows ${requirement.normalized_requirement}?`,
      relatedSkills: safeArray(analysis?.keywords).filter(keyword =>
        requirement.requirement_text.toLowerCase().includes(keyword.toLowerCase())
      ),
      seniorityLevel: typeof job?.seniority_level === "string" ? job.seniority_level : null,
    }))
  }

  const required = safeArray(analysis?.qualifications_required).map((text): RequirementInput => ({
    text,
    priority: "required" as RequirementPriority,
  }))
  const preferred = safeArray(analysis?.qualifications_preferred).map((text): RequirementInput => ({
    text,
    priority: "preferred" as RequirementPriority,
  }))
  const keywords = safeArray(analysis?.keywords).map((text): RequirementInput => ({
    text,
    priority: "keyword" as RequirementPriority,
  }))
  return [...required, ...preferred, ...keywords]
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .flatMap(value => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map(value => value.trim())
    )
  )
}

function evidenceSpecificityScore(evidence: Record<string, unknown>[]): number {
  const signals = evidence.flatMap(item => [
    item.proof_snippet,
    item.company_name,
    item.role_name,
    item.tools_used,
    item.outcomes,
    item.responsibilities,
  ])
  const signalCount = uniqueStrings(signals).length
  return Math.min(100, signalCount * 12)
}

function allowedUsageFromEvidence(evidence: Record<string, unknown>[]): EvidenceAllowedUsage {
  const rules = evidence.map(item => getEvidenceUsageRule(item as never))
  if (rules.includes("blocked")) return "blocked"
  if (rules.includes("interview_only")) return "interview_only"
  if (rules.every(rule => rule === "cover_letter_only")) return "cover_letter_allowed"
  if (rules.includes("unsupported")) return "resume_allowed_with_reframe"
  return "resume_allowed"
}

function buildRiskFlags(match: RequirementEvidenceMatch, evidence: Record<string, unknown>[]): string[] {
  const flags = new Set<string>(match.riskFlags ?? [])
  if (match.proof_decision === "skipped") flags.add("user_skipped")
  if (match.status === "gap") flags.add("missing_evidence")
  if (match.status === "partial") flags.add("partial_match")
  if (match.confidence === "low") flags.add("low_confidence")
  if (evidence.length === 0) flags.add("no_packet_evidence")
  if (evidence.some(item => typeof item.what_not_to_overstate === "string" && item.what_not_to_overstate.trim())) {
    flags.add("overstatement_constraint")
  }
  if (uniqueStrings(evidence.flatMap(item => item.tools_used)).length === 0) flags.add("missing_system_or_tool")
  if (uniqueStrings(evidence.flatMap(item => item.outcomes)).length === 0) flags.add("missing_outcome")
  if (evidenceSpecificityScore(evidence) < 35) flags.add("low_specificity")
  return Array.from(flags)
}

function mergeExistingMatch(
  nextMatch: RequirementEvidenceMatch,
  existingMatch: RequirementEvidenceMatch | undefined
): RequirementEvidenceMatch {
  if (!existingMatch) return nextMatch

  const matched_evidence_ids = Array.from(new Set([
    ...nextMatch.matched_evidence_ids,
    ...existingMatch.matched_evidence_ids,
  ]))
  const matched_evidence_titles = Array.from(new Set([
    ...nextMatch.matched_evidence_titles,
    ...existingMatch.matched_evidence_titles,
  ]))
  const evidence_types = Array.from(new Set([
    ...nextMatch.evidence_types,
    ...existingMatch.evidence_types,
  ]))
  const hasConfirmedEvidence = matched_evidence_ids.length > nextMatch.matched_evidence_ids.length
  const status =
    nextMatch.status === "met" ? "met" :
    existingMatch.proof_decision === "skipped" ? existingMatch.status :
    hasConfirmedEvidence && nextMatch.status === "gap" ? "partial" :
    existingMatch.status === "met" ? "met" :
    existingMatch.status === "partial" ? "partial" :
    nextMatch.status

  return {
    ...nextMatch,
    status,
    matched_evidence_ids,
    matched_evidence_titles,
    evidence_types,
    confidence: status === "met" ? nextMatch.confidence : existingMatch.confidence ?? nextMatch.confidence,
    match_method: hasConfirmedEvidence ? "manual" : nextMatch.match_method,
    reasoning: hasConfirmedEvidence
      ? existingMatch.reasoning || "Includes user-confirmed evidence mapped through the coach."
      : nextMatch.reasoning,
    riskFlags: Array.from(new Set([
      ...(nextMatch.riskFlags ?? []),
      ...(existingMatch.riskFlags ?? []),
    ])),
    proof_decision: existingMatch.proof_decision ?? (
      status === "met" && matched_evidence_ids.length > 0 ? "auto_mapped" : nextMatch.proof_decision
    ),
    user_claim: existingMatch.user_claim,
    skip_reason: existingMatch.skip_reason,
    confirmed_at: existingMatch.confirmed_at,
    skipped_at: existingMatch.skipped_at,
    mapped_by_session_ids: existingMatch.mapped_by_session_ids,
    updated_at: existingMatch.updated_at ?? nextMatch.updated_at,
  }
}

export function buildCapabilityPacket(
  match: RequirementEvidenceMatch,
  evidenceCandidates: Record<string, unknown>[]
): EvidenceIntelligencePacket {
  const matchedEvidence = evidenceCandidates.filter(item =>
    match.matched_evidence_ids.includes(String(item.id))
  )
  const matchScore =
    match.proof_decision === "skipped" ? 0 :
    match.status === "met" ? match.confidence === "high" ? 90 : 75 :
    match.status === "partial" ? 50 :
    10
  const matchStrength =
    matchScore >= 75 ? "strong" :
    matchScore >= 40 ? "partial" :
    "weak"
  const riskFlags = buildRiskFlags(match, matchedEvidence)
  return {
    packet_id: `pkt_${match.requirement_id}`,
    requirement: match.requirement_text,
    normalized: match.normalized_requirement,
    priority: match.priority,
    matchedEvidenceIds: match.matched_evidence_ids,
    matchedEvidenceTitles: match.matched_evidence_titles,
    proofSnippets: uniqueStrings(matchedEvidence.map(item => item.proof_snippet)),
    systems: uniqueStrings([
      ...matchedEvidence.flatMap(item => item.systems_used ?? []),
      ...matchedEvidence.flatMap(item => item.workflows_created ?? []),
    ]),
    tools: uniqueStrings(matchedEvidence.flatMap(item => item.tools_used ?? [])),
    outcomes: uniqueStrings(matchedEvidence.flatMap(item => item.outcomes ?? [])),
    responsibilities: uniqueStrings(matchedEvidence.flatMap(item => item.responsibilities ?? [])),
    companies: uniqueStrings(matchedEvidence.map(item => item.company_name)),
    roles: uniqueStrings(matchedEvidence.map(item => item.role_name)),
    matchStrength,
    matchScore,
    matchReason: match.reasoning,
    evidenceStrength: match.confidence,
    riskFlags,
    allowedUsage: match.proof_decision === "skipped" ? "blocked" : allowedUsageFromEvidence(matchedEvidence),
    proofDecision: match.proof_decision,
    userClaim: match.user_claim,
    whyIncluded:
      match.proof_decision === "skipped"
        ? "User explicitly skipped this requirement; generation must not claim it."
        :
      match.status === "gap"
        ? "No approved evidence currently supports this requirement."
        : `${match.priority} requirement matched to ${matchedEvidence.length} evidence item(s) with ${match.confidence} confidence.`,
  }
}

export async function initializeEvidenceMapForJob({
  supabase,
  userId,
  jobId,
}: BuildEvidenceMapParams): Promise<CanonicalJobEvidenceMap> {
  const [{ data: analysis }, { data: existingJob }] = await Promise.all([
    supabase
      .from("job_analyses")
      .select("qualifications_required, qualifications_preferred, responsibilities, keywords, ats_phrases")
      .eq("job_id", jobId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id, role_title, company_name, job_description, seniority_level, evidence_map")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  const existingMap =
    existingJob?.evidence_map &&
    typeof existingJob.evidence_map === "object" &&
    !Array.isArray(existingJob.evidence_map)
      ? existingJob.evidence_map as Record<string, unknown>
      : {}

  const requirement_matches = buildRequirementInputs(analysis ?? null, existingJob ?? null)
    .map((requirement): RequirementEvidenceMatch => {
      const normalized = requirement.normalized ?? normalizeRequirement(requirement.text)
      return {
        requirement_id: requirement.id ?? normalized.slice(0, 80).replace(/\s+/g, "_"),
        requirement_text: requirement.text,
        normalized_requirement: normalized,
        expectation_type: requirement.expectationType,
        employer_intent: requirement.employerIntent,
        recovery_question: requirement.recoveryQuestion,
        proof_needed: requirement.proofNeeded,
        evidence_questions: requirement.evidenceQuestions,
        related_skills: requirement.relatedSkills,
        seniority_level: requirement.seniorityLevel,
        priority: requirement.priority,
        status: "gap",
        matched_evidence_ids: [],
        matched_evidence_titles: [],
        evidence_types: [],
        confidence: "low",
        match_method: "fuzzy",
        reasoning: "Initial analysis placeholder. No evidence has been confirmed for this requirement yet.",
        riskFlags: ["missing_evidence", "no_packet_evidence"],
        proof_decision: "needs_judgment",
        updated_at: new Date().toISOString(),
      }
    })

  const evidenceMap = {
    ...existingMap,
    matching_complete: false,
    completed_at: new Date().toISOString(),
    version: crypto.randomUUID(),
    requirement_matches,
    capability_packets: requirement_matches.map(match => buildCapabilityPacket(match, [])),
    coverage_summary: buildCoverageSummary(requirement_matches),
    gap_summary: requirement_matches.map(match => match.requirement_text),
  } as CanonicalJobEvidenceMap

  await supabase
    .from("jobs")
    .update({
      evidence_map: evidenceMap,
      evidence_map_version: evidenceMap.version,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", userId)

  return evidenceMap
}

export async function buildEvidenceMapForJob({
  supabase,
  userId,
  jobId,
}: BuildEvidenceMapParams): Promise<CanonicalJobEvidenceMap> {
  const [{ data: analysis }, { data: evidenceCandidates }, { data: existingJob }] = await Promise.all([
    supabase
      .from("job_analyses")
      .select("qualifications_required, qualifications_preferred, responsibilities, keywords, ats_phrases")
      .eq("job_id", jobId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("evidence_library")
      .select(
        "id, source_title, source_type, role_name, company_name, responsibilities, tools_used, outcomes, industries, proof_snippet, confidence_level, is_user_approved, visibility_status, is_active, what_not_to_overstate"
      )
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("jobs")
      .select("id, role_title, company_name, job_description, seniority_level, evidence_map, evidence_map_version")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle(),
  ])
  const existingMap =
    existingJob?.evidence_map &&
    typeof existingJob.evidence_map === "object" &&
    !Array.isArray(existingJob.evidence_map)
      ? existingJob.evidence_map as Record<string, unknown>
      : {}
  const requirements = buildRequirementInputs(analysis ?? null, existingJob ?? null)
  const existingMatches = Array.isArray(existingMap.requirement_matches)
    ? existingMap.requirement_matches.filter((match): match is RequirementEvidenceMatch =>
        Boolean(match) && typeof match === "object" && typeof (match as RequirementEvidenceMatch).requirement_id === "string"
      )
    : []
  const existingById = new Map(existingMatches.map(match => [match.requirement_id, match]))
  const requirement_matches = requirements.map(requirement =>
    mergeExistingMatch(matchRequirementToEvidence({
      requirement: requirement.text,
      requirementId: requirement.id,
      expectationType: requirement.expectationType,
      employerIntent: requirement.employerIntent,
      recoveryQuestion: requirement.recoveryQuestion,
      proofNeeded: requirement.proofNeeded,
      evidenceQuestions: requirement.evidenceQuestions,
      relatedSkills: requirement.relatedSkills,
      seniorityLevel: requirement.seniorityLevel,
      priority: requirement.priority,
      evidenceCandidates: evidenceCandidates ?? [],
    }), existingById.get(requirement.id ?? ""))
  )
  const requirementMatchesWithDecisions = applyAutoMappedProofDecisions(requirement_matches)
  const coverage_summary = buildCoverageSummary(requirementMatchesWithDecisions)
  const capability_packets = requirementMatchesWithDecisions.map(match =>
    buildCapabilityPacket(match, (evidenceCandidates ?? []) as Record<string, unknown>[])
  )
  const gap_summary = requirementMatchesWithDecisions
    .filter(match => match.proof_decision !== "skipped" && (match.status === "gap" || match.status === "unknown"))
    .map(match => match.requirement_text)
  const evidenceMap = {
    ...existingMap,
    matching_complete: isMatchingComplete(requirementMatchesWithDecisions),
    completed_at: new Date().toISOString(),
    version: crypto.randomUUID(),
    requirement_matches: requirementMatchesWithDecisions,
    capability_packets,
    coverage_summary,
    gap_summary,
  } as CanonicalJobEvidenceMap
  await supabase
    .from("jobs")
    .update({
      evidence_map: evidenceMap,
      evidence_map_version: evidenceMap.version,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", userId)
  return evidenceMap
}
