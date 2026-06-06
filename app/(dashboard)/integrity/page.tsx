import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

import { ResumeIntegrityFlags } from "@/components/integrity/ResumeIntegrityFlags"
import { UploadResumeAndScore } from "./UploadResumeAndScore"
import { Button } from "@/components/ui/button"
import { Briefcase, CheckSquare, FileText } from "lucide-react"

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

  let flags: Array<{ bullet: string; risk_score: number; risk_level: "high" | "medium" | "low"; flag_reason: string; suggested_rewrite: string }> = []
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
      risk_level: (f.risk_level ?? "low") as "high" | "medium" | "low",
      flag_reason: f.flag_reason,
      suggested_rewrite: f.suggested_rewrite,
    }))
  }

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Quality Gate</p>
          <h1 className="hw-page-title">Resume Integrity Flags</h1>
          <p className="hw-page-subtitle">Review flagged resume bullets and suggested rewrites before you apply.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/documents">
            <Button size="sm" variant="outline" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Documents
            </Button>
          </Link>
          <Link href="/ready-to-apply">
            <Button size="sm" className="hw-btn-primary gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" /> Ready to Apply
            </Button>
          </Link>
        </div>
      </div>
      <UploadResumeAndScore />
      {resume ? (
        <div>
          <div className="mb-4 text-muted-foreground text-xs">Latest resume: {resume.file_name} (uploaded {new Date(resume.uploaded_at).toLocaleString()})</div>
          <ResumeIntegrityFlags flags={flags} />
        </div>
      ) : (
        <div className="hw-empty">
          <Briefcase className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No resume integrity checks yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a resume above, or generate materials from a job and review them before applying.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> View Pipeline
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
