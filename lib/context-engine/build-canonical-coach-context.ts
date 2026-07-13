import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeProfileLinks } from "@/lib/profile-knowledge-resolver"
import { detectEvidenceDuplicates } from "@/lib/evidence/duplicates"
import { evaluateReadiness } from "@/lib/readiness/evaluator"

type EvidenceRow = {
  id: string
  source_title: string | null
  source_type: string | null
  role_name: string | null
  company_name: string | null
  date_range: string | null
  responsibilities: string[] | null
  tools_used: string[] | null
  outcomes: string[] | null
  proof_snippet: string | null
  confidence_level: string | null
  is_active: boolean | null
  is_user_approved?: boolean | null
}

type JobRow = {
  id: string
  role_title: string | null
  company_name: string | null
  status: string | null
  score: number | null
  evidence_map: unknown
  job_url: string | null
  generation_status?: string | null
  quality_passed?: boolean | null
  applied_at?: string | null
}

type ProfileRow = {
  full_name?: string | null
  headline?: string | null
  summary?: string | null
  location?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  website_url?: string | null
  career_context?: unknown
}

export type CanonicalCoachContext = {
  job: {
    id: string
    title: string
    company: string
    status: string | null
    score: number | null
    job_url: string | null
  }
  profile: {
    full_name: string | null
    headline: string | null
    summary: string | null
    location: string | null
    career_context: unknown
  }
  links: Array<{ link_type: string; url: string }>
  evidence: {
    total: number
    approved: number
    top_titles: string[]
    duplicate_groups: number
    ranked: Array<{
      id: string
      title: string
      source_type: string | null
      score: number
      reasons: string[]
    }>
  }
  readiness: {
    isReady: boolean
    canGenerate: boolean
    blockedReasons: string[]
  }
  inference: {
    source_summary: string[]
    next_question: string | null
    duplicate_scan: string[]
    provenance_notes: string[]
  }
}

function evidenceRankScore(row: EvidenceRow) {
  let score = 0
  const reasons: string[] = []
  if (row.is_user_approved !== false) {
    score += 25
    reasons.push("user approved")
  }
  if (row.proof_snippet?.trim()) {
    score += 20
    reasons.push("has proof snippet")
  }
  if ((row.outcomes?.length ?? 0) > 0) {
    score += 15
    reasons.push("has outcomes")
  }
  if ((row.responsibilities?.length ?? 0) > 0) {
    score += 10
    reasons.push("has responsibilities")
  }
  if ((row.tools_used?.length ?? 0) > 0) {
    score += 10
    reasons.push("has tools")
  }
  if (row.confidence_level === "high") {
    score += 20
    reasons.push("high confidence")
  } else if (row.confidence_level === "medium") {
    score += 10
    reasons.push("medium confidence")
  }
  if (row.source_type === "work_experience") {
    score += 10
    reasons.push("work experience")
  } else if (row.source_type === "project" || row.source_type === "certification") {
    score += 8
    reasons.push("structured proof source")
  }
  return { score: Math.min(100, score), reasons }
}

function rankLinks(
  links: Array<{ link_type: string; url: string }>,
  profile: ProfileRow | null,
) {
  return links
    .map((link) => {
      let score = 0
      const reasons: string[] = []
      if (link.link_type === "linkedin") {
        score += 20
        reasons.push("identity surface")
      }
      if (link.link_type === "github") {
        score += 22
        reasons.push("code proof")
      }
      if (link.link_type === "portfolio" || link.link_type === "website") {
        score += 18
        reasons.push("portfolio proof")
      }
      if (profile?.headline || profile?.summary) {
        score += 8
        reasons.push("profile context")
      }
      if (link.url.includes("linkedin.com")) {
        score += 10
        reasons.push("canonical linkedin url")
      }
      if (link.url.includes("github.com")) {
        score += 10
        reasons.push("canonical github url")
      }
      return { ...link, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}

export async function buildCanonicalCoachContext(
  supabase: SupabaseClient,
  userId: string,
  jobId?: string | null,
): Promise<CanonicalCoachContext | null> {
  const [profileResult, evidenceResult, linksResult, jobsResult] = await Promise.all([
    supabase.from("user_profile").select("full_name, headline, summary, location, linkedin_url, github_url, website_url, career_context").eq("user_id", userId).maybeSingle(),
    supabase.from("evidence_library").select("id, source_title, source_type, role_name, company_name, date_range, responsibilities, tools_used, outcomes, proof_snippet, confidence_level, is_active, is_user_approved").eq("user_id", userId).eq("is_active", true),
    supabase.from("user_profile_links").select("link_type, url, is_primary").eq("user_id", userId).order("is_primary", { ascending: false }).order("created_at", { ascending: true }),
    jobId
      ? supabase.from("jobs").select("id, role_title, company_name, status, score, evidence_map, job_url, generation_status, quality_passed, applied_at").eq("id", jobId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const profile = profileResult.data as ProfileRow | null
  const evidence = (evidenceResult.data ?? []) as EvidenceRow[]
  const normalizedLinks = normalizeProfileLinks(linksResult.data ?? [])
  const links = Object.entries(normalizedLinks).flatMap(([link_type, url]) => (url ? [{ link_type, url }] : []))
  const rankedLinks = rankLinks(links, profile)
  const job = (jobsResult.data as JobRow | null) ?? null

  const activeJob = job ?? {
    id: "unknown",
    role_title: profile?.headline ?? "Your next target role",
    company_name: "",
    status: null,
    score: null,
    evidence_map: null,
    job_url: null,
  }

  const duplicates = detectEvidenceDuplicates(
    evidence.map((row) => ({
      id: row.id,
      source_type: row.source_type,
      source_title: row.source_title,
      role_name: row.role_name,
      company_name: row.company_name,
      date_range: row.date_range,
      responsibilities: row.responsibilities,
      tools_used: row.tools_used,
      outcomes: row.outcomes,
      proof_snippet: row.proof_snippet,
    })),
    evidence.map((row) => ({
      id: row.id,
      source_type: row.source_type,
      source_title: row.source_title,
      role_name: row.role_name,
      company_name: row.company_name,
      date_range: row.date_range,
      responsibilities: row.responsibilities,
      tools_used: row.tools_used,
      outcomes: row.outcomes,
      proof_snippet: row.proof_snippet,
    })),
  )

  const readiness = evaluateReadiness({
    id: activeJob.id,
    role_title: activeJob.role_title,
    company_name: activeJob.company_name,
    status: activeJob.status,
    score: activeJob.score,
    evidence_map: activeJob.evidence_map,
    quality_passed: activeJob.quality_passed,
    generated_resume: null,
    generated_cover_letter: null,
    applied_at: activeJob.applied_at ?? null,
  } as any)

  return {
    job: {
      id: activeJob.id,
      title: activeJob.role_title ?? "Your next target role",
      company: activeJob.company_name ?? "",
      status: activeJob.status,
      score: activeJob.score,
      job_url: activeJob.job_url,
    },
    profile: {
      full_name: profile?.full_name ?? null,
      headline: profile?.headline ?? null,
      summary: profile?.summary ?? null,
      location: profile?.location ?? null,
      career_context: profile?.career_context ?? null,
    },
    links,
    evidence: {
      total: evidence.length,
      approved: evidence.filter((row) => row.is_user_approved !== false).length,
      top_titles: evidence.slice(0, 5).map((row) => row.source_title ?? "Untitled proof"),
      duplicate_groups: duplicates.length,
      ranked: [...evidence]
        .map((row) => {
          const rankedItem = evidenceRankScore(row)
          return {
            id: row.id,
            title: row.source_title ?? "Untitled proof",
            source_type: row.source_type,
            score: rankedItem.score,
            reasons: rankedItem.reasons,
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 7),
    },
    readiness: {
      isReady: readiness.isReady,
      canGenerate: readiness.canGenerate,
      blockedReasons: readiness.blockedReasons,
    },
    inference: {
      source_summary: [
        profile?.headline ? `Profile headline: ${profile.headline}` : null,
        profile?.summary ? `Profile summary present` : null,
        rankedLinks.length > 0 ? `${rankedLinks.length} ranked links` : null,
        evidence.length > 0 ? `${evidence.length} evidence items` : null,
        duplicates.length > 0 ? `${duplicates.length} duplicate groups to review` : null,
      ].filter(Boolean) as string[],
      next_question: !readiness.canGenerate
        ? readiness.blockedReasons[0] ?? "Confirm the strongest missing proof."
        : null,
      duplicate_scan: duplicates.map((group) => `${group.incoming.source_title ?? "Untitled"} may duplicate existing proof`),
      provenance_notes: [
        rankedLinks.slice(0, 3).map((link) => `Link ${link.link_type} ranked ${link.score}/100: ${link.reasons.join(", ")}`).join(" | "),
        evidence
          .slice(0, 3)
          .map((row) => `${row.source_title ?? "Untitled"} from ${row.source_type ?? "unknown"}${row.is_user_approved !== false ? " approved" : ""}`)
          .join(" | "),
      ].filter(Boolean) as string[],
    },
  }
}
