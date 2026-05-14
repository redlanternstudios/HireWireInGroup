"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ResumeVersion {
  id: string
  job_id: string
  version_number: number
  resume_text: string | null
  cover_letter_text: string | null
  resume_format: string | null
  resume_font: string | null
  quality_passed: boolean | null
  quality_score: number | null
  strategy: string | null
  label: string | null
  created_at: string
}

export async function getResumeVersions(jobId: string): Promise<ResumeVersion[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("job_resume_versions")
    .select("id, job_id, version_number, resume_text, cover_letter_text, resume_format, resume_font, quality_passed, quality_score, strategy, label, created_at")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .order("version_number", { ascending: false })
    .limit(10)

  return data ?? []
}

export async function restoreResumeVersion(
  jobId: string,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: version, error: fetchError } = await supabase
    .from("job_resume_versions")
    .select("resume_text, cover_letter_text")
    .eq("id", versionId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !version) return { success: false, error: "Version not found" }

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      edited_resume: version.resume_text,
      edited_cover_letter: version.cover_letter_text,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .is("deleted_at", null)

  if (updateError) return { success: false, error: updateError.message }

  revalidatePath(`/jobs/${jobId}/documents`)
  return { success: true }
}
