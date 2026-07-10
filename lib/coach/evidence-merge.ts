import type { SupabaseClient } from "@supabase/supabase-js"
import { mergeStringArrays, scoreEvidenceDuplicate, type EvidenceDuplicateRow } from "@/lib/evidence/duplicates"

type EvidenceRecord = Record<string, unknown>

export type CoachEvidenceInput = {
  source_title: string
  source_type: string
  proof_snippet?: string | null
  role_name?: string | null
  company_name?: string | null
  date_range?: string | null
  responsibilities?: string[] | null
  tools_used?: string[] | null
  outcomes?: string[] | null
  approved_achievement_bullets?: string[] | null
  approved_keywords?: string[] | null
  industries?: string[] | null
  role_family_tags?: string[] | null
  systems_used?: string[] | null
  workflows_created?: string[] | null
  normalized_label?: string | null
  source_url?: string | null
  raw_resume_section?: string | null
  visibility_status?: string | null
  confidence_level?: string | null
  confidence_score?: number | null
  evidence_weight?: string | null
  is_user_approved?: boolean
  what_not_to_overstate?: string | null
  what_visible?: string | null
  what_shipped?: string | null
  business_goal?: string | null
  user_problem?: string | null
  project_name?: string | null
  credential_type?: string | null
}

export type CoachEvidenceUpsertResult = {
  evidence: EvidenceRecord
  merged: boolean
  duplicateConfidence?: number
  duplicateEvidenceId?: string
}

const MERGE_THRESHOLD = 0.78

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function betterText(existing: unknown, incoming: unknown) {
  const current = clean(existing)
  const next = clean(incoming)
  if (!current) return next || null
  if (!next) return current || null
  return next.length > current.length ? next : current
}

function buildCandidate(input: CoachEvidenceInput): EvidenceDuplicateRow {
  return {
    source_type: input.source_type,
    source_title: input.source_title,
    role_name: input.role_name,
    company_name: input.company_name,
    date_range: input.date_range,
    responsibilities: input.responsibilities,
    tools_used: input.tools_used,
    outcomes: input.outcomes,
    proof_snippet: input.proof_snippet,
  }
}

function mergePayload(existing: EvidenceRecord, input: CoachEvidenceInput): Record<string, unknown> {
  return {
    source_type: input.source_type || existing.source_type,
    source_title: clean(input.source_title) || existing.source_title,
    role_name: clean(input.role_name) || existing.role_name || null,
    company_name: clean(input.company_name) || existing.company_name || null,
    date_range: clean(input.date_range) || existing.date_range || null,
    proof_snippet: betterText(existing.proof_snippet, input.proof_snippet),
    responsibilities: mergeStringArrays(
      Array.isArray(existing.responsibilities) ? existing.responsibilities : [],
      input.responsibilities ?? [],
    ),
    tools_used: mergeStringArrays(
      Array.isArray(existing.tools_used) ? existing.tools_used : [],
      input.tools_used ?? [],
    ),
    outcomes: mergeStringArrays(
      Array.isArray(existing.outcomes) ? existing.outcomes : [],
      input.outcomes ?? [],
    ),
    approved_achievement_bullets: mergeStringArrays(
      Array.isArray(existing.approved_achievement_bullets) ? existing.approved_achievement_bullets : [],
      input.approved_achievement_bullets ?? [],
    ),
    approved_keywords: mergeStringArrays(
      Array.isArray(existing.approved_keywords) ? existing.approved_keywords : [],
      input.approved_keywords ?? [],
    ),
    industries: mergeStringArrays(
      Array.isArray(existing.industries) ? existing.industries : [],
      input.industries ?? [],
    ),
    role_family_tags: mergeStringArrays(
      Array.isArray(existing.role_family_tags) ? existing.role_family_tags : [],
      input.role_family_tags ?? [],
    ),
    systems_used: mergeStringArrays(
      Array.isArray(existing.systems_used) ? existing.systems_used : [],
      input.systems_used ?? [],
    ),
    workflows_created: mergeStringArrays(
      Array.isArray(existing.workflows_created) ? existing.workflows_created : [],
      input.workflows_created ?? [],
    ),
    normalized_label: clean(input.normalized_label) || existing.normalized_label || null,
    source_url: clean(input.source_url) || existing.source_url || null,
    raw_resume_section: clean(input.raw_resume_section) || existing.raw_resume_section || null,
    visibility_status: clean(input.visibility_status) || existing.visibility_status || null,
    confidence_level: input.confidence_level || existing.confidence_level || null,
    confidence_score:
      typeof input.confidence_score === "number"
        ? Math.max(input.confidence_score, Number(existing.confidence_score ?? 0) || 0)
        : existing.confidence_score ?? null,
    evidence_weight: input.evidence_weight || existing.evidence_weight || null,
    is_user_approved: input.is_user_approved ?? existing.is_user_approved ?? true,
    what_not_to_overstate: clean(input.what_not_to_overstate) || existing.what_not_to_overstate || null,
    what_visible: clean(input.what_visible) || existing.what_visible || null,
    what_shipped: clean(input.what_shipped) || existing.what_shipped || null,
    business_goal: clean(input.business_goal) || existing.business_goal || null,
    user_problem: clean(input.user_problem) || existing.user_problem || null,
    project_name: clean(input.project_name) || existing.project_name || null,
    credential_type: clean(input.credential_type) || existing.credential_type || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }
}

export async function upsertCoachEvidence(
  supabase: SupabaseClient,
  userId: string,
  input: CoachEvidenceInput,
): Promise<CoachEvidenceUpsertResult> {
  const candidate = buildCandidate(input)
  const { data: existingRows, error } = await supabase
    .from("evidence_library")
    .select(`
      id, source_type, source_title, role_name, company_name, date_range,
      responsibilities, tools_used, outcomes, proof_snippet, approved_achievement_bullets,
      approved_keywords, industries, role_family_tags, systems_used, workflows_created,
      normalized_label, source_url, raw_resume_section, visibility_status, confidence_level,
      confidence_score, evidence_weight, is_user_approved, what_not_to_overstate, what_visible,
      what_shipped, business_goal, user_problem, project_name, credential_type, is_active
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(150)

  if (error) throw error

  const bestMatch = (existingRows ?? [])
    .map((row) => {
      const candidateScore = scoreEvidenceDuplicate(candidate, row as EvidenceDuplicateRow)
      return candidateScore ? { row: row as EvidenceRecord, ...candidateScore } : null
    })
    .filter((match): match is NonNullable<typeof match> => !!match)
    .sort((left, right) => right.confidence - left.confidence)[0]

  if (bestMatch && bestMatch.confidence >= MERGE_THRESHOLD) {
    const updates = mergePayload(bestMatch.row, input)
    const { data, error: updateError } = await supabase
      .from("evidence_library")
      .update(updates)
      .eq("id", String(bestMatch.row.id))
      .eq("user_id", userId)
      .select("*")
      .single()

    if (updateError) throw updateError
    return {
      evidence: data,
      merged: true,
      duplicateConfidence: bestMatch.confidence,
      duplicateEvidenceId: String(bestMatch.row.id),
    }
  }

  const insertPayload = mergePayload({}, input)
  const { data, error: insertError } = await supabase
    .from("evidence_library")
    .insert({
      user_id: userId,
      ...insertPayload,
      is_user_approved: input.is_user_approved ?? true,
      is_active: true,
    })
    .select("*")
    .single()

  if (insertError) throw insertError
  return {
    evidence: data,
    merged: false,
  }
}

