import { sanitizeCoachContext, sanitizeRecommendations } from '@/lib/coach/context/sanitize'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

import DocumentsEditor from './DocumentsEditor'
import { evaluateJobReadiness } from '@/lib/readiness'
import { buildCoachContext } from '@/lib/coach/context/build-context'
import { detectCoachSignals } from '@/lib/coach/signals/engine'
import { generateRecommendations } from '@/lib/coach/recommendations'
import { sortRecommendations } from '@/lib/coach/recommendations/priority'
import { WorkflowCoachPanelClient } from '@/components/coach/WorkflowCoachPanelClient'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job, error } = await supabase
    .from('jobs')
    .select(
      `id, role_title, company_name, job_url, status,
       generated_resume, generated_cover_letter,
       edited_resume, edited_cover_letter, last_edited_at,
       generation_timestamp`
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !job) notFound()


  const hasDocs = !!(job.generated_resume || job.generated_cover_letter)

  // Readiness (canonical)
  const readiness = await evaluateJobReadiness(job.id, user.id)

  // Build CoachContext from real data
  const coachContext = buildCoachContext({
    workflowStage: readiness?.stage || job.status || "unknown",
    blockers: readiness?.reasons_not_ready || [],
    readiness: readiness?.is_ready ?? false,
    evidenceCoverage: readiness?.evidence_count ? (readiness.evidence_count / (readiness.requirement_count || 1)) : 0,
    fitScore: job.score ?? 0,
    generationHistory: [], // TODO: wire real generation history if available
    applicationHistory: [], // TODO: wire real application history if available
    recentOutcomes: [], // TODO: wire real outcomes if available
    userPreferences: {}, // TODO: wire real preferences if available
    currentPage: `/jobs/${job.id}/documents`,
    currentAction: "documents",
  })

  // Coach memory (stub for now)
  const coachMemory = { priorRecommendations: [], acceptedRecommendations: [], ignoredRecommendations: [], generationOutcomes: [], applicationOutcomes: [], recurringWeakAreas: [] }

  // Detect signals
  const coachSignals = detectCoachSignals(coachContext, coachMemory)

  // Generate recommendations (real logic should deduplicate, cooldown, and prioritize)
  let coachRecommendations = generateRecommendations(coachContext, coachSignals)
  // Deduplicate by message
  coachRecommendations = coachRecommendations.filter((rec, idx, arr) => arr.findIndex(r => r.message === rec.message) === idx)
  // TODO: implement cooldown logic (skip for now)
  // Sort by priority
  coachRecommendations = sortRecommendations(coachRecommendations)

  // Insights and momentum (stub for now)
  const coachInsights: string[] = []
  const coachMomentum = undefined

  // Coach visibility logic
  const showCoach = (coachRecommendations.length > 0 || (readiness?.reasons_not_ready?.length ?? 0) > 0 || coachInsights.length > 0)

  if (!hasDocs) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        return (
          <div className="mx-auto max-w-5xl p-6">
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              ← Back to dashboard
            </Link>
            <div className="mt-4 mb-6">
              <h1 className="text-2xl font-semibold">{job.role_title}
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
            {/* Embedded Coach Panel */}
            {showCoach && (
              <div className="mb-4">
                <WorkflowCoachPanelClient
                  recommendations={sanitizeRecommendations(coachRecommendations)}
                  blockers={Array.isArray(readiness?.reasons_not_ready) ? readiness.reasons_not_ready.map(String) : []}
                  insights={Array.isArray(coachInsights) ? coachInsights.map(String) : []}
                  momentum={coachMomentum ? String(coachMomentum) : undefined}
                />
              </div>
            )}
            <DocumentsEditor job={job} />
          </div>
        )
            <span>Generated {new Date(job.generation_timestamp).toLocaleString()}</span>
          )}
          {job.last_edited_at && (
            <span className="ml-3">
              · Last edited {new Date(job.last_edited_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <DocumentsEditor job={job} />
    </div>
  )
}
