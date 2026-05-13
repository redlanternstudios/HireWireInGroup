import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckSquare, FileText, ArrowRight, Plus, Rocket,
  Clock, ShieldCheck, Target, Briefcase,
} from "lucide-react"

export const dynamic = "force-dynamic"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default async function ReadyQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: readyJobs }, { data: allJobs }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, role_title, company_name, status, generated_resume, generation_timestamp, created_at")
      .eq("user_id", user.id)
      .in("status", ["ready", "needs_review"])
      .is("deleted_at", null)
      .order("generation_timestamp", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from("jobs")
      .select("id, role_title, company_name, status, generation_status")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .not("status", "in", '("ready","needs_review","applied","interviewing","offered","rejected","archived")'),
  ])

  const jobList = readyJobs ?? []
  const pipelineJobs = allJobs ?? []
  const readyCount = jobList.filter(j => j.status === "ready").length
  const reviewCount = jobList.filter(j => j.status === "needs_review").length

  // Find closest to ready
  const closestJob = pipelineJobs.find(j => j.generation_status === "complete" || j.status === "analyzed")

  const readyRules = [
    { label: "Job analyzed", desc: "AI fit analysis complete" },
    { label: "Documents generated", desc: "Resume & cover letter created" },
    { label: "Quality reviewed", desc: "Claims verified against evidence" },
    { label: "Package approved", desc: "Ready for submission" },
  ]

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Launch Pad</p>
          <h1 className="hw-page-title">Ready to Apply</h1>
          <p className="hw-page-subtitle">Jobs with verified, generated materials ready for submission.</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Job
          </Button>
        </Link>
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value">{jobList.length}</span>
          <span className="hw-stat-label">Total ready</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{readyCount}</span>
          <span className="hw-stat-label">Ready now</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{reviewCount}</span>
          <span className="hw-stat-label">Needs review</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-muted-foreground">{pipelineJobs.length}</span>
          <span className="hw-stat-label">In pipeline</span>
        </div>
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main */}
        <div className="hw-workspace-main">
          {jobList.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <Rocket className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nothing in the launch pad yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Jobs appear here once HireWire has analyzed the posting, generated a truthful application package, and passed quality review. Add a job to your pipeline to get started.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/jobs/new">
                  <Button size="sm" className="hw-btn-primary gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add a job
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> View pipeline
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {readyCount > 0 && (
                <div className="mb-4">
                  <h2 className="hw-section-label mb-2">Ready Now</h2>
                  {jobList.filter(j => j.status === "ready").map(job => (
                    <div key={job.id} className="hw-card px-5 py-4 flex items-center justify-between gap-4 mb-2">
                      <Link href={`/jobs/${job.id}`} className="flex items-center gap-4 min-w-0 flex-1 group">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {job.role_title ?? "Untitled role"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {job.company_name ?? "—"}
                            {job.generation_timestamp && (
                              <span className="hidden sm:inline"> · Generated {timeAgo(job.generation_timestamp)}</span>
                            )}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="text-[10px] font-medium status-ready">Ready</Badge>
                        <Link
                          href={`/jobs/${job.id}/documents`}
                          className="inline-flex items-center gap-1.5 hw-card px-3 py-1.5 text-xs font-medium hover:border-primary/30 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> View docs
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reviewCount > 0 && (
                <div>
                  <h2 className="hw-section-label mb-2">Needs Review</h2>
                  {jobList.filter(j => j.status === "needs_review").map(job => (
                    <div key={job.id} className="hw-card px-5 py-4 flex items-center justify-between gap-4 mb-2">
                      <Link href={`/jobs/${job.id}`} className="flex items-center gap-4 min-w-0 flex-1 group">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {job.role_title ?? "Untitled role"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{job.company_name ?? "—"}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="text-[10px] font-medium status-analyzing">Needs review</Badge>
                        <Link
                          href={`/jobs/${job.id}/documents`}
                          className="inline-flex items-center gap-1.5 hw-card px-3 py-1.5 text-xs font-medium hover:border-primary/30 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="hw-workspace-rail">
          {/* Application Confidence */}
          <div>
            <h2 className="hw-section-label mb-3">Readiness Rules</h2>
            <div className="hw-panel p-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-1">
                A job reaches this page only after clearing all four gates:
              </p>
              {readyRules.map((rule, i) => (
                <div key={rule.label} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{i + 1}. {rule.label}</p>
                    <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next action */}
          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Next Best Action</h2>
            {readyCount > 0 ? (
              <div className="hw-next-action">
                <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{readyCount} package{readyCount !== 1 ? "s" : ""} ready</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review your documents above and submit your strongest applications today.
                  </p>
                </div>
              </div>
            ) : closestJob ? (
              <Link href={`/jobs/${closestJob.id}`}>
                <div className="hw-next-action group">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Closest to ready</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{closestJob.role_title ?? "Untitled role"}</p>
                    <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      View job <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/jobs/new">
                <div className="hw-next-action group">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Add your first job</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Start by analyzing a job posting.</p>
                    <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Add Job <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
