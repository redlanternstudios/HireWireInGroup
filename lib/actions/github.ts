"use server"

import { revalidatePath } from "next/cache"
import { importGithubEvidence } from "@/lib/github/importEvidence"
import { createClient } from "@/lib/supabase/server"

type ParseGithubActionResult = {
  success?: true
  error?: string
  evidence_created?: number
  username?: string
}

export async function parseGithubLink(linkId: string): Promise<ParseGithubActionResult> {
  return parseGithub({ linkId })
}

export async function parseGithubUrl(githubUrl: string): Promise<ParseGithubActionResult> {
  return parseGithub({ githubUrl })
}

async function parseGithub(input: { linkId?: string; githubUrl?: string }): Promise<ParseGithubActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  const result = await importGithubEvidence(supabase, user.id, input)
  if (!result.success) {
    return { error: result.error }
  }

  revalidatePath("/onboarding")
  revalidatePath("/profile")
  revalidatePath("/dashboard")

  return {
    success: true,
    evidence_created: result.evidence_created,
    username: result.username,
  }
}
