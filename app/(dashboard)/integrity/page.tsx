import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { ResumeIntegrityFlags } from "@/components/integrity/ResumeIntegrityFlags"
import { UploadResumeAndScore } from "./UploadResumeAndScore"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function IntegrityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch the latest resume version and integrity flags for this user
  const { data: resume } = await supabase
    .from("candidate_resume_versions")
    .select("id, file_name, uploaded_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .single()

  let flags = []
  if (resume) {
    const { data: flagRows } = await supabase
      .from("career_integrity_scores")
      .select("bullet_text, risk_score, risk_level, flag_reason, suggested_rewrite")
      .eq("user_id", user.id)
      .eq("resume_version_id", resume.id)
      .order("bullet_index")
    flags = (flagRows || []).map(f => ({
      bullet: f.bullet_text,
      risk_score: f.risk_score,
      risk_level: f.risk_level,
      flag_reason: f.flag_reason,
      suggested_rewrite: f.suggested_rewrite,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resume Integrity Flags</h1>
        <p className="text-sm text-muted-foreground">Review flagged resume bullets and suggested rewrites before you apply.</p>
      </div>
      <UploadResumeAndScore />
      {resume ? (
        <div>
          <div className="mb-4 text-muted-foreground text-xs">Latest resume: {resume.file_name} (uploaded {new Date(resume.uploaded_at).toLocaleString()})</div>
          <ResumeIntegrityFlags flags={flags} />
        </div>
      ) : null}
    </div>
  )
}
