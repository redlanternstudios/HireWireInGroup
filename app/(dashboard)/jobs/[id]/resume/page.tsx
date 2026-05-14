import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ResumeIntelligenceEngine } from "./ResumeIntelligenceEngine"

export const dynamic = "force-dynamic"

export default async function ResumeIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      role_title,
      company_name,
      job_url,
      status,
      fit,
      score,
      generated_resume,
      generated_cover_letter,
      edited_resume,
      edited_cover_letter,
      resume_strategy,
      resume_format,
      generation_quality_score,
      governance_passed,
      governance_drift_score,
      voice_mode,
      voice_drift_result,
      voice_integrity_passed,
      intelligence,
      evidence_map,
      score_strengths,
      score_gaps,
      resume_provenance,
      generation_timestamp,
      quality_passed,
      generation_quality_issues,
      job_analyses (
        id,
        summary,
        matched_skills,
        matched_tools,
        known_gaps,
        ats_phrases,
        keywords,
        responsibilities,
        qualifications_required,
        qualifications_preferred
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !job) notFound()

  const analysis = Array.isArray(job.job_analyses)
    ? job.job_analyses[0]
    : job.job_analyses

  const intelligence = job.intelligence as Record<string, unknown> | null

  return (
    <div className="hw-page max-w-5xl">
      {/* Back nav */}
      <div className="mb-4">
        <Link
          href={`/jobs/${id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to job
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Resume Intelligence Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {job.role_title ?? "Untitled role"} · {job.company_name ?? "—"}
        </p>
      </div>

      <ResumeIntelligenceEngine
        jobId={id}
        job={{
          id: job.id,
          role_title: job.role_title,
          company_name: job.company_name,
          job_url: job.job_url,
          status: job.status,
          fit: job.fit,
          score: job.score,
          generated_resume: job.generated_resume,
          generated_cover_letter: job.generated_cover_letter,
          edited_resume: job.edited_resume,
          edited_cover_letter: job.edited_cover_letter,
          resume_strategy: job.resume_strategy,
          resume_format: job.resume_format,
          generation_quality_score: job.generation_quality_score,
          governance_passed: job.governance_passed,
          governance_drift_score: job.governance_drift_score,
          voice_mode: job.voice_mode,
          voice_integrity_passed: job.voice_integrity_passed,
          intelligence,
          evidence_map: job.evidence_map as Record<string, unknown> | null,
          score_strengths: job.score_strengths as string[] | null,
          score_gaps: job.score_gaps as string[] | null,
          resume_provenance: job.resume_provenance as Array<Record<string, unknown>> | null,
          generation_timestamp: job.generation_timestamp,
          quality_passed: job.quality_passed,
          generation_quality_issues: job.generation_quality_issues as string[] | null,
        }}
        analysis={analysis ?? null}
      />
    </div>
  )
}
