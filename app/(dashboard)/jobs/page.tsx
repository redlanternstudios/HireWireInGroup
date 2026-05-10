import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JobsPipelineClient, type PipelineJob } from "@/components/jobs/jobs-pipeline-client"

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch all fields needed by display-stage, staleness, and priority helpers
  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id,
      role_title,
      company_name,
      status,
      generation_status,
      generated_resume,
      generated_cover_letter,
      quality_passed,
      applied_at,
      evidence_map,
      score,
      updated_at,
      created_at,
      job_scores ( overall_score )
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200)

  // Normalize score — prefer job_scores.overall_score, fall back to jobs.score
  const pipeline: PipelineJob[] = (jobs ?? []).map(j => {
    const scores = (j.job_scores as Array<{ overall_score?: number }> | null) ?? []
    const score = scores[0]?.overall_score ?? (j.score as number | null) ?? null
    return {
      id:                    j.id,
      role_title:            j.role_title ?? null,
      company_name:          j.company_name ?? null,
      status:                j.status ?? null,
      generation_status:     j.generation_status ?? null,
      generated_resume:      j.generated_resume ?? null,
      generated_cover_letter: j.generated_cover_letter ?? null,
      quality_passed:        j.quality_passed ?? null,
      applied_at:            j.applied_at ?? null,
      evidence_map:          (j.evidence_map as Record<string, unknown> | null) ?? null,
      score,
      updated_at:            j.updated_at ?? null,
      created_at:            j.created_at,
    }
  })

  return <JobsPipelineClient jobs={pipeline} />
}
