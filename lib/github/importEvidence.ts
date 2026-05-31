import type { createClient } from "@/lib/supabase/server"
import {
  buildProfileEvidenceContent,
  buildRepoEvidenceContent,
  extractGithubUsername,
  fetchGithubProfile,
} from "@/lib/github/parseProfile"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export type ImportGithubEvidenceInput = {
  linkId?: string
  githubUrl?: string
}

export type ImportGithubEvidenceResult =
  | {
      success: true
      username: string
      evidence_created: number
      repos_parsed: number
    }
  | {
      success: false
      error: string
      status: number
    }

export async function importGithubEvidence(
  supabase: ServerSupabase,
  userId: string,
  input: ImportGithubEvidenceInput
): Promise<ImportGithubEvidenceResult> {
  let githubUrl = input.githubUrl ?? null
  let linkId = input.linkId ?? null

  if (linkId) {
    const { data: link, error: linkErr } = await supabase
      .from("user_profile_links")
      .select("id, url, link_type")
      .eq("id", linkId)
      .eq("user_id", userId)
      .maybeSingle()

    if (linkErr || !link) {
      return { success: false, error: "Link not found", status: 404 }
    }

    if (link.link_type !== "github") {
      return { success: false, error: "Link is not a github link", status: 400 }
    }

    githubUrl = link.url
  }

  if (!githubUrl) {
    return { success: false, error: "Must provide link_id or github_url", status: 400 }
  }

  const username = extractGithubUsername(githubUrl)
  if (!username) {
    await markLinkFailed(supabase, linkId, "Invalid GitHub URL")
    return { success: false, error: "Invalid GitHub URL", status: 400 }
  }

  let fetchResult: Awaited<ReturnType<typeof fetchGithubProfile>>
  try {
    fetchResult = await fetchGithubProfile(username)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "GitHub fetch failed"
    await markLinkFailed(supabase, linkId, msg)
    return { success: false, error: msg, status: 502 }
  }

  const { profile, repos } = fetchResult

  const { error: delErr } = await supabase
    .from("evidence_library")
    .delete()
    .eq("user_id", userId)
    .eq("source_type", "github")

  if (delErr) {
    return { success: false, error: `Dedup failed: ${delErr.message}`, status: 500 }
  }

  const rows = [
    {
      user_id: userId,
      source_type: "github",
      provenance: "user_manual",
      source_title: `GitHub Profile: @${profile.username}`,
      source_url: profile.profile_url,
      proof_snippet: buildProfileEvidenceContent(profile),
      confidence_level: "high",
      is_active: true,
    },
    ...repos.map(repo => ({
      user_id: userId,
      source_type: "github",
      provenance: "user_manual",
      source_title: `Repo: ${repo.name}`,
      source_url: repo.html_url,
      proof_snippet: buildRepoEvidenceContent(repo),
      confidence_level: "high",
      is_active: true,
    })),
  ]

  const { error: insErr, data: inserted } = await supabase
    .from("evidence_library")
    .insert(rows)
    .select("id")

  if (insErr) {
    await markLinkFailed(supabase, linkId, insErr.message)
    return { success: false, error: `Insert failed: ${insErr.message}`, status: 500 }
  }

  if (linkId) {
    await supabase
      .from("user_profile_links")
      .update({
        parse_status: "complete",
        parse_error: null,
        last_parsed_at: new Date().toISOString(),
      })
      .eq("id", linkId)
      .eq("user_id", userId)
  }

  return {
    success: true,
    username,
    evidence_created: inserted?.length ?? 0,
    repos_parsed: repos.length,
  }
}

async function markLinkFailed(
  supabase: ServerSupabase,
  linkId: string | null,
  errorMsg: string
) {
  if (!linkId) return

  await supabase
    .from("user_profile_links")
    .update({
      parse_status: "failed",
      parse_error: errorMsg,
      last_parsed_at: new Date().toISOString(),
    })
    .eq("id", linkId)
}
