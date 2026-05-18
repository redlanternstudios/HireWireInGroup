import type {
  ContextClaimVerdict,
  ContextEvidenceItem,
  ContextGeneratedClaim,
  ContextProfileModel,
  ContextSource,
  ContextSourceType,
  JobRequirementModel,
} from "./types"
import { buildEvidenceGraph } from "./build-evidence-graph"
import { generatePositioning } from "./generate-positioning"
import { inferCapabilities } from "./infer-capabilities"
import { normalizeProfile } from "./normalize-profile"
import { parseProfile } from "./parse-profile"
import { reverseEngineerJob } from "./reverse-engineer-job"
import { scoreGapMatch } from "./score-gap-match"
import { validateClaims } from "./validate-claims"
import { nowIso, stableId } from "./utils"

export function isContextEngineEnabled() {
  return process.env.CONTEXT_ENGINE_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_CONTEXT_ENGINE_ENABLED === "true"
}

export function buildProfileContext(input: {
  userId?: string
  sourceId?: string
  sourceType: ContextSourceType
  sourceLabel: string
  rawText: string
  sourceUrl?: string | null
  parsedData?: Record<string, unknown> | null
}): ContextProfileModel {
  const parsed = parseProfile(input)
  const normalizedEntities = normalizeProfile(parsed.evidenceItems)
  const capabilities = inferCapabilities(parsed.evidenceItems, normalizedEntities)
  const graph = buildEvidenceGraph({
    sources: [parsed.source],
    evidenceItems: parsed.evidenceItems,
    entities: normalizedEntities,
    capabilities,
  })
  return {
    source: parsed.source,
    evidenceItems: parsed.evidenceItems,
    normalizedEntities,
    capabilities,
    graph,
  }
}

export function buildEvidenceLibraryContext(input: {
  userId?: string
  records: Array<Record<string, any>>
  sourceLabel?: string
}): ContextProfileModel {
  const createdAt = nowIso()
  const source: ContextSource = {
    id: stableId("ctx_src", [input.userId, "evidence_library", input.records.map((record) => record.id).join(",")]),
    user_id: input.userId,
    source_type: "evidence_library",
    source_label: input.sourceLabel ?? "Evidence Library",
    raw_text: input.records.map((record) => evidenceRecordText(record)).join("\n\n"),
    parsed_at: createdAt,
    created_at: createdAt,
    trust_level: "high",
  }
  const evidenceItems: ContextEvidenceItem[] = input.records.flatMap((record) => {
    const rawText = evidenceRecordText(record)
    const confidence = record.confidence_level === "high" ? "high" as const : record.confidence_level === "low" ? "low" as const : "medium" as const
    const base = {
      user_id: input.userId,
      source_id: source.id,
      source_type: "evidence_library" as const,
      source_label: String(record.source_title ?? "Evidence"),
      confidence,
      extraction_method: "existing_structured_data" as const,
      created_at: createdAt,
    }
    return [
      {
        id: String(record.id),
        evidence_type: "raw_snippet" as const,
        raw_text: rawText || String(record.source_title ?? ""),
        normalized_value: rawText || String(record.source_title ?? ""),
        metadata: { evidence_library_id: record.id, source_type: record.source_type },
        ...base,
      },
      ...(Array.isArray(record.tools_used) ? record.tools_used.map((tool: string) => ({
        id: stableId("ctx_ev", [record.id, "tool", tool]),
        evidence_type: "tool" as const,
        raw_text: tool,
        normalized_value: tool,
        metadata: { evidence_library_id: record.id },
        ...base,
      })) : []),
      ...(Array.isArray(record.outcomes) ? record.outcomes.map((outcome: string) => ({
        id: stableId("ctx_ev", [record.id, "achievement", outcome]),
        evidence_type: "achievement" as const,
        raw_text: outcome,
        normalized_value: outcome,
        metadata: { evidence_library_id: record.id },
        ...base,
      })) : []),
    ].filter((item) => item.raw_text && item.normalized_value)
  })
  const normalizedEntities = normalizeProfile(evidenceItems)
  const capabilities = inferCapabilities(evidenceItems, normalizedEntities)
  const graph = buildEvidenceGraph({
    sources: [source],
    evidenceItems,
    entities: normalizedEntities,
    capabilities,
  })
  return { source, evidenceItems, normalizedEntities, capabilities, graph }
}

export function buildJobContext(input: {
  jobId?: string
  jobText: string
  title?: string | null
  company?: string | null
  requirements?: string[]
  responsibilities?: string[]
  keywords?: string[]
}) {
  return reverseEngineerJob(input)
}

export function runContextGapMatch(input: {
  userId?: string
  jobId?: string
  profile: ContextProfileModel
  requirements: JobRequirementModel[]
}) {
  const gapReport = scoreGapMatch({
    userId: input.userId,
    jobId: input.jobId,
    evidenceItems: input.profile.evidenceItems,
    entities: input.profile.normalizedEntities,
    capabilities: input.profile.capabilities,
    requirements: input.requirements,
  })
  const positioning = generatePositioning({ gapReport, requirements: input.requirements })
  const graph = buildEvidenceGraph({
    sources: [input.profile.source],
    evidenceItems: input.profile.evidenceItems,
    entities: input.profile.normalizedEntities,
    capabilities: input.profile.capabilities,
    requirements: input.requirements,
    gapMatches: gapReport.matches,
  })
  return { gapReport, positioning, graph }
}

export function validateGeneratedClaims(input: {
  userId?: string
  jobId?: string
  generatedDocumentId?: string | null
  claims: ContextGeneratedClaim[]
  evidenceItems: ContextEvidenceItem[]
  gapMatches?: ReturnType<typeof scoreGapMatch>["matches"]
}): ContextClaimVerdict[] {
  return validateClaims(input)
}

export async function mirrorProfileContext(params: {
  supabase: any
  userId: string
  context: ContextProfileModel
}) {
  const { supabase, userId, context } = params
  await ignoreMissingTable(supabase.from("context_sources").upsert({
    id: context.source.id,
    user_id: userId,
    source_type: context.source.source_type,
    source_label: context.source.source_label,
    source_url: context.source.source_url ?? null,
    raw_text: context.source.raw_text,
    parsed_at: context.source.parsed_at,
    created_at: context.source.created_at,
  }, { onConflict: "id" }))

  if (context.evidenceItems.length > 0) {
    await ignoreMissingTable(supabase.from("context_evidence_items").upsert(context.evidenceItems.map((item) => ({
      id: item.id,
      user_id: userId,
      source_id: item.source_id,
      evidence_type: item.evidence_type,
      raw_text: item.raw_text,
      normalized_value: item.normalized_value,
      confidence: item.confidence,
      extraction_method: item.extraction_method,
      metadata: item.metadata,
      created_at: item.created_at,
    })), { onConflict: "id" }))
  }

  if (context.normalizedEntities.length > 0) {
    await ignoreMissingTable(supabase.from("context_normalized_entities").upsert(context.normalizedEntities.map((entity) => ({
      id: entity.id,
      user_id: userId,
      entity_type: entity.entity_type,
      canonical_name: entity.canonical_name,
      aliases: entity.aliases,
      category: entity.category,
      confidence: entity.confidence,
      ambiguity_flags: entity.ambiguity_flags,
      evidence_ids: entity.evidence_ids,
      created_at: entity.created_at,
    })), { onConflict: "id" }))
  }

  if (context.capabilities.length > 0) {
    await ignoreMissingTable(supabase.from("context_capabilities").upsert(context.capabilities.map((capability) => ({
      id: capability.id,
      user_id: userId,
      capability_name: capability.capability_name,
      capability_type: capability.capability_type,
      inferred_from_evidence_ids: capability.inferred_from_evidence_ids,
      reasoning_summary: capability.reasoning_summary,
      confidence: capability.confidence,
      risk_level: capability.risk_level,
      allowed_usage: capability.allowed_usage,
      created_at: capability.created_at,
    })), { onConflict: "id" }))
  }
}

export async function mirrorJobContext(params: {
  supabase: any
  jobId: string
  jobContext: ReturnType<typeof buildJobContext>
}) {
  const { supabase, jobId, jobContext } = params
  if (jobContext.requirements.length === 0) return
  await ignoreMissingTable(supabase.from("job_requirement_models").upsert(jobContext.requirements.map((requirement) => ({
    id: requirement.id,
    job_id: jobId,
    requirement_text: requirement.requirement_text,
    normalized_requirement: requirement.normalized_requirement,
    category: requirement.category,
    importance: requirement.importance,
    confidence: requirement.confidence,
    evidence_from_job_post: requirement.evidence_from_job_post,
    created_at: requirement.created_at,
  })), { onConflict: "id" }))
}

export async function mirrorGapMatches(params: {
  supabase: any
  userId: string
  jobId: string
  matches: ReturnType<typeof scoreGapMatch>["matches"]
}) {
  if (params.matches.length === 0) return
  await ignoreMissingTable(params.supabase.from("context_gap_matches").upsert(params.matches.map((match) => ({
    id: match.id,
    user_id: params.userId,
    job_id: params.jobId,
    requirement_id: match.requirement_id,
    match_type: match.match_type,
    match_score: match.match_score,
    evidence_ids: match.evidence_ids,
    explanation: match.explanation,
    resume_permission: match.resume_permission,
    cover_letter_permission: match.cover_letter_permission,
    interview_permission: match.interview_permission,
    risk_level: match.risk_level,
    created_at: match.created_at,
  })), { onConflict: "id" }))
}

export async function mirrorClaimVerdicts(params: {
  supabase: any
  userId: string
  jobId?: string
  verdicts: ContextClaimVerdict[]
}) {
  if (params.verdicts.length === 0) return
  await ignoreMissingTable(params.supabase.from("context_claim_verdicts").upsert(params.verdicts.map((verdict) => ({
    id: verdict.id,
    user_id: params.userId,
    job_id: params.jobId ?? verdict.job_id ?? null,
    generated_document_id: verdict.generated_document_id ?? null,
    claim_text: verdict.claim_text,
    verdict: verdict.verdict,
    evidence_ids: verdict.evidence_ids,
    drift_score: verdict.drift_score,
    risk_flags: verdict.risk_flags,
    suggested_rewrite: verdict.suggested_rewrite,
    created_at: verdict.created_at,
  })), { onConflict: "id" }))
}

async function ignoreMissingTable(query: PromiseLike<{ error: { code?: string; message?: string } | null }>) {
  const result = await query
  if (result.error && result.error.code !== "42P01") {
    console.error("[context-engine] mirror write failed", result.error)
  }
}

function evidenceRecordText(record: Record<string, any>) {
  return [
    record.source_title,
    record.role_name,
    record.company_name,
    record.proof_snippet,
    record.what_shipped,
    record.what_visible,
    ...(Array.isArray(record.responsibilities) ? record.responsibilities : []),
    ...(Array.isArray(record.outcomes) ? record.outcomes : []),
    ...(Array.isArray(record.tools_used) ? record.tools_used : []),
  ].filter(Boolean).join(". ")
}
