import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, CheckSquare, FileText, Plus, ShieldCheck, Star } from "lucide-react"

import ReadinessChecklist from "@/components/ReadinessChecklist"
import { ReadinessContextBanner } from "@/components/workflow/ReadinessContextBanner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { MarkAsAppliedButton } from "@/app/(dashboard)/jobs/[id]/MarkAsAppliedButton"

export const dynamic = "force-dynamic"

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "Not generated"
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default async function ReadyToApplyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const [{ data: jobs }, { data: recentReadyEvents }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, role_title, company_name, status, generated_resume, generated_cover_letter, quality_passed, evidence_map, generation_timestamp, created_at, applied_at, score, score_gaps, gap_clarifications, gaps_addressed")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .not("status", "in", "(applied,interviewing,offered,rejected,archived)")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("domain_events")
      .select("job_id, payload")
      .eq("user_id", user.id)
      .eq("event_type", "readiness_changed")
      .gte("created_at", cutoff48h)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const recentlyReadyJobIds = new Set(
    (recentReadyEvents ?? [])
      .filter(e => (e.payload as Record<string, unknown>)?.can_apply === true)
      .map(e => e.job_id)
      .filter((id): id is string => id !== null)
  )

  const evaluatedJobs = (jobs ?? []).map(job => ({
    job,
    readiness: evaluateReadiness(job),
  }))
  const readyJobs = evaluatedJobs.filter(({ readiness }) => readiness.isReady)
  const blockedJobs = evaluatedJobs.filter(({ readiness }) => !readiness.isReady)
  const justClearedJobs = readyJobs.filter(({ job }) => recentlyReadyJobIds.has(job.id))
  const firstBlockedReadiness = blockedJobs[0]?.readiness ?? null

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Application Gate</p>
          <h1 className="hw-page-title">Ready to Apply</h1>
          <p className="hw-page-subtitle">Apply only after the readiness checklist clears, or log an explicit override.</p>
        </div>
        <Link href="/jobs?add=true">
            <Button size="sm" className="hw-btn-primary gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Job
          </Button>
        </Link>
      </div>

      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{readyJobs.length}</span>
          <span className="hw-stat-label">Ready</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-rose-600">{blockedJobs.length}</span>
          <span className="hw-stat-label">Blocked</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{evaluatedJobs.length}</span>
          <span className="hw-stat-label">Active jobs</span>
        </div>
      </div>

      {firstBlockedReadiness && (
        <ReadinessContextBanner
          stage={firstBlockedReadiness.stage}
          blockedReasons={firstBlockedReadiness.blockedReasons}
          nextAction={firstBlockedReadiness.nextAction}
        />
      )}

      {evaluatedJobs.length === 0 ? (
        <div className="hw-empty">
          <div className="hw-empty-icon">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">No active jobs to evaluate</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Add a job, generate materials, and HireWire will show whether the application can be submitted.
            </p>
          </div>
          <Link href="/jobs?add=true">
              <Button size="sm" className="hw-btn-primary gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="hw-workspace">
          <div className="hw-workspace-main space-y-8">

          {justClearedJobs.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex items-start gap-3">
              <Star className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {justClearedJobs.length === 1
                    ? "1 job just cleared all readiness checks"
                    : `${justClearedJobs.length} jobs just cleared all readiness checks`}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {justClearedJobs.map(({ job }) => job.role_title ?? "Untitled").join(", ")} — review and apply before momentum fades.
                </p>
              </div>
            </div>
          )}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="hw-section-label">Ready to Apply</h2>
            </div>

            {readyJobs.length === 0 ? (
              <div className="hw-panel p-4 text-sm text-muted-foreground">
                No packages have cleared all readiness checks yet.
              </div>
            ) : (
              <div className="space-y-3">
                {readyJobs.map(({ job, readiness }) => (
                  <div key={job.id} className="hw-card p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{job.role_title ?? "Untitled role"}</h3>
                          <Badge variant="outline" className={`text-[10px] ${readiness.displayClassName}`}>
                            {readiness.displayLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {job.company_name ?? "-"} · Generated {timeAgo(job.generation_timestamp ?? job.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/jobs/${job.id}/documents`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Review docs
                          </Button>
                        </Link>
                        <MarkAsAppliedButton jobId={job.id} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <ReadinessChecklist checklist={readiness.checklist} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <h2 className="hw-section-label">Blocked</h2>
            </div>

            {blockedJobs.length === 0 ? (
              <div className="hw-panel p-4 text-sm text-muted-foreground">
                No blocked applications right now.
              </div>
            ) : (
              <div className="space-y-3">
                {blockedJobs.map(({ job, readiness }) => (
                  <div key={job.id} className="hw-card p-5 border-l-4 border-l-rose-500">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{job.role_title ?? "Untitled role"}</h3>
                          <Badge variant="outline" className={`text-[10px] ${readiness.displayClassName}`}>
                            {readiness.displayLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{job.company_name ?? "-"}</p>
                        <p className="text-sm text-rose-600 mt-2">{readiness.blockedReasons.join(", ")}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Link href={readiness.nextAction?.href ?? `/jobs/${job.id}`}>
                          <Button size="sm" className="hw-btn-primary">
                            {readiness.nextAction?.label ?? "Open job"}
                          </Button>
                        </Link>
                        <MarkAsAppliedButton jobId={job.id} variant="ghost" label="Override readiness" />
                      </div>
                    </div>

                    <div className="mt-4">
                      <ReadinessChecklist checklist={readiness.checklist} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          </div>

          <aside className="hw-workspace-rail space-y-4">
            <div className="hw-panel p-4">
              <p className="hw-section-label mb-2">Readiness Rules</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Resume generated</li>
                <li>Cover letter generated</li>
                <li>Evidence threshold met</li>
                <li>Quality pass complete</li>
              </ul>
            </div>

            <div className="hw-panel p-4">
              <p className="hw-section-label mb-2">Next Best Action</p>
              <p className="text-xs text-muted-foreground">
                If blocked, open the job and resolve the first checklist item in red. If ready, review docs one more time and apply from this gate.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
