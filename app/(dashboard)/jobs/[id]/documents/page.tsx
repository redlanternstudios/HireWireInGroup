import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DocumentsEditor from './DocumentsEditor'
import ApplicationPackagePreview from '@/components/documents/ApplicationPackagePreview'
import {
  normalizeResumeFont,
  normalizeResumeFormat,
  recommendResumeFormat,
} from '@/lib/resume-formats'
import { evaluateReadiness } from '@/lib/readiness/evaluator'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job, error } = await supabase
    .from('jobs')
    .select(
      `id, role_title, company_name, job_url, status,
       generated_resume, generated_cover_letter,
       edited_resume, edited_cover_letter, last_edited_at,
       generation_timestamp, quality_passed, generation_status`
    )
    .select(`
      id, role_title, company_name, job_url,
      generated_resume, generated_cover_letter,
      edited_resume, edited_cover_letter,
      resume_format, resume_font, format_recommendation_reason,
      generation_timestamp, last_edited_at,
      quality_passed, evidence_map, status, applied_at,
      package_review_status, voice_drift_result, voice_mode
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !job) notFound()

  const hasDocs = !!(job.generated_resume || job.generated_cover_letter)

  if (!hasDocs) {
    return (
      <div className="hw-page max-w-2xl">
        <div className="hw-card px-6 py-10 flex flex-col items-center text-center gap-4">
          <p className="text-sm font-semibold">No documents generated yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Return to the job detail page and run document generation to create your tailored resume and cover letter.
          </p>
          <Link href={`/jobs/${id}`} className="text-xs text-primary hover:underline">
            Back to job
          </Link>
        </div>
      </div>
    )
  }

  const recommendation = recommendResumeFormat({
    roleTitle: job.role_title,
    applicationChannel: job.job_url,
    resumeText: job.edited_resume ?? job.generated_resume,
  })
  const resumeFormat = normalizeResumeFormat(job.resume_format ?? recommendation.format)
  const resumeFont = normalizeResumeFont(job.resume_font ?? recommendation.font, resumeFormat)
  const jobWithFormat = {
    ...job,
    resume_format: resumeFormat,
    resume_font: resumeFont,
    format_recommendation_reason: job.format_recommendation_reason ?? recommendation.reason,
    recommended_resume_format: recommendation.format,
    recommended_resume_font: recommendation.font,
    recommended_resume_reason: recommendation.reason,
  }
  const readiness = evaluateReadiness(jobWithFormat)

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link href={`/jobs/${id}`} className="text-sm text-blue-600 hover:underline">
        Back to job
      </Link>
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold">
          {job.role_title}
          <span className="ml-2 text-gray-500">@ {job.company_name}</span>
        </h1>
        <div className="mt-1 text-sm text-gray-500">
          {job.generation_timestamp && (
            <span>Generated {new Date(job.generation_timestamp).toLocaleString()}</span>
          )}
          {job.last_edited_at && (
            <span className="ml-3">
              · Last edited {new Date(job.last_edited_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <DocumentsEditor
        job={job}
        qualityPassed={job.quality_passed ?? false}
        generationStatus={job.generation_status ?? "needs_review"}
      />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <DocumentsEditor job={jobWithFormat} />
        </div>
        <aside className="w-full md:w-96 shrink-0">
          <ApplicationPackagePreview job={jobWithFormat} readiness={readiness} userId={user.id} />
        </aside>
      </div>
    </div>
  )
}
