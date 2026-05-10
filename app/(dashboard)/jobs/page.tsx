import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JobInputForm } from "./JobInputForm"
import {
  Briefcase, Plus, FileText, ArrowRight, CheckSquare,
  Clock, Send, Sparkles, Target,
} from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", queued: "Queued", analyzing: "Analyzing", analyzed: "Analyzed",
  generating: "Generating", ready: "Ready", needs_review: "Needs review",
  applied: "Applied", interviewing: "Interviewing", offered: "Offered",
  rejected: "Rejected", archived: "Archived", error: "Error",
}
const STATUS_CLASS: Record<string, string> = {
  draft: "status-draft", queued: "status-analyzing", analyzing: "status-analyzing",
  analyzed: "status-analyzing", generating: "status-analyzing", ready: "status-ready",
  needs_review: "status-analyzing", applied: "status-applied", interviewing: "status-applied",
  offered: "status-offered", rejected: "status-rejected",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, generation_status, generated_resume, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50)

  const jobList = jobs ?? []
  const analyzing = jobList.filter(j => ["analyzing", "generating", "queued"].includes(j.status)).length
  const ready = jobList.filter(j => j.generation_status === "complete" || j.status === "ready").length
  const applied = jobList.filter(j => ["applied", "interviewing", "offered"].includes(j.status)).length
  const rejected = jobList.filter(j => j.status === "rejected").length

  const stageGroups = [
    { label: "Processing", count: analyzing, color: "text-amber-600", status: ["analyzing", "generating", "queued"] },
    { label: "Ready", count: ready, color: "text-emerald-600", status: ["ready"] },
    { label: "Applied", count: applied, color: "text-blue-600", status: ["applied", "interviewing", "offered"] },
    { label: "Rejected", count: rejected, color: "text-rose-500", status: ["rejected"] },
  ]

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Pipeline Hub</p>
          <h1 className="hw-page-title">All Jobs</h1>
          <p className="hw-page-subtitle">Every opportunity in your pipeline — from discovery to outcome.</p>
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
          <span className="hw-stat-label">Total</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{analyzing}</span>
          <span className="hw-stat-label">Processing</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{ready}</span>
          <span className="hw-stat-label">Ready</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-600">{applied}</span>
          <span className="hw-stat-label">Applied</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-rose-500">{rejected}</span>
          <span className="hw-stat-label">Rejected</span>
        </div>
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main */}
        <div className="hw-workspace-main">
          {/* Analyze a Job */}
          <div className="hw-card p-5">
            <h2 className="hw-section-label mb-4">Analyze a Job</h2>
            <JobInputForm />
          </div>

          {/* Job List */}
          {jobList.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No jobs tracked yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Paste a job description above to start your pipeline. HireWire analyzes it against your career context and generates a truthful application package.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="hw-section-label mb-3">Your Pipeline</h2>
              <div className="space-y-2">
                {jobList.map(job => {
                  const isReady = job.generation_status === "complete" || !!job.generated_resume
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                      <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {job.role_title ?? "Untitled role"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{job.company_name ?? "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {isReady && (
                            <Link
                              href={`/jobs/${job.id}/documents`}
                              onClick={e => e.stopPropagation()}
                              className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" /> Docs
                            </Link>
                          )}
                          <Badge variant="outline" className={`text-[10px] font-medium ${STATUS_CLASS[job.status] ?? "status-draft"}`}>
                            {STATUS_LABEL[job.status] ?? job.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground hidden md:block">{timeAgo(job.created_at)}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Rail — Pipeline Intelligence */}
        <div className="hw-workspace-rail">
          <h2 className="hw-section-label mb-3">Pipeline Intelligence</h2>

          {/* Stage breakdown */}
          <div className="hw-panel p-4 space-y-3">
            {stageGroups.filter(g => g.count > 0).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No jobs yet.</p>
            ) : (
              stageGroups.map(group => (
                <div key={group.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{group.label}</span>
                  <div className="flex-1 quality-bar">
                    <div
                      className="quality-bar-fill"
                      style={{ width: jobList.length > 0 ? `${Math.max(6, Math.round((group.count / jobList.length) * 100))}%` : "0%" }}
                    />
                  </div>
                  <span className={`text-xs font-bold tabular-nums w-5 text-right ${group.color}`}>{group.count}</span>
                </div>
              ))
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-2 mt-4">
            <h2 className="hw-section-label mb-2">Quick Actions</h2>
            {[
              { href: "/ready-queue", icon: CheckSquare, label: "Ready Queue", desc: `${ready} ready to send` },
              { href: "/applications", icon: Send, label: "Applications", desc: `${applied} submitted` },
              { href: "/coach", icon: Sparkles, label: "Career Coach", desc: "Get job search advice" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="hw-card px-3.5 py-3 flex items-center gap-3 group">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {/* Next action */}
          {ready > 0 && (
            <div className="mt-4">
              <h2 className="hw-section-label mb-2">Next Best Action</h2>
              <Link href="/ready-queue">
                <div className="hw-next-action group">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{ready} package{ready !== 1 ? "s" : ""} ready</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Launch your strongest applications now.</p>
                    <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Go to Ready Queue <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {analyzing > 0 && (
            <div className="mt-4">
              <h2 className="hw-section-label mb-2">Processing</h2>
              <div className="hw-panel p-3.5 flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{analyzing}</span> job{analyzing !== 1 ? "s" : ""} being analyzed. This typically takes 1–3 minutes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
