import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JobsPipelineClient, type PipelineJob } from "@/components/jobs/jobs-pipeline-client"

export const dynamic = "force-dynamic"

type JobsRow = {
  id: string
  role_title: string | null
  company_name: string | null
  status: string | null
  generation_status: string | null
  generated_resume: string | null
  generated_cover_letter: string | null
  quality_passed: boolean | null
  applied_at: string | null
  evidence_map: Record<string, unknown> | null
  score: number | null
  score_gaps: string[] | null
  gap_clarifications: unknown
  gaps_addressed: string[] | null
  intelligence: Record<string, unknown> | null
  updated_at: string | null
  created_at: string
  job_scores: Array<{ overall_score?: number }> | null
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ add?: string | string[] }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const addParam = resolvedSearchParams?.add
  const initialShowAddJob = Array.isArray(addParam)
    ? addParam[0] === "true"
    : addParam === "true"
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
      score_gaps,
      gap_clarifications,
      gaps_addressed,
      intelligence,
      updated_at,
      created_at,
      job_scores ( overall_score )
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200)

  // Normalize score — prefer job_scores.overall_score, fall back to jobs.score
  const pipeline: PipelineJob[] = ((jobs ?? []) as JobsRow[]).map((j) => {
    const scores = j.job_scores ?? []
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
      score_gaps:            (j.score_gaps as string[] | null) ?? null,
      gap_clarifications:    j.gap_clarifications ?? null,
      gaps_addressed:        (j.gaps_addressed as string[] | null) ?? null,
      intelligence:          (j.intelligence as Record<string, unknown> | null) ?? null,
      updated_at:            j.updated_at ?? null,
      created_at:            j.created_at,
    }
  })

  return <JobsPipelineClient jobs={pipeline} initialShowAddJob={initialShowAddJob} />
}
