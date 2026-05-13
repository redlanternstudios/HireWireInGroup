import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Send, ArrowRight, CheckSquare, MessageSquare,
  Trophy, XCircle,
} from "lucide-react"

export const dynamic = "force-dynamic"

// Display outcome derived from jobs.status (canonical outcome field)
const STATUS_CLASS: Record<string, string> = {
  applied: "status-applied",
  interviewing: "status-applied",
  offered: "status-offered",
  rejected: "status-rejected",
}
const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
}
const STATUS_ICONS: Record<string, React.ElementType> = {
  applied: Send,
  interviewing: MessageSquare,
  offered: Trophy,
  rejected: XCircle,
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

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Source of truth: applications table joined with jobs for display metadata.
  // jobs.status drives the outcome stage (applied → interviewing → offered/rejected).
  const { data: rawApplications } = await supabase
    .from("applications")
    .select(`
      id, applied_at, status, method,
      job:jobs(id, role_title, company_name, status, deleted_at)
    `)
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false })
    .limit(50)

  type JobRef = {
    id: string
    role_title: string | null
    company_name: string | null
    status: string | null
    deleted_at: string | null
  }
  type ApplicationRow = {
    id: string
    applied_at: string
    status: string
    method: string | null
    job: JobRef | null
  }

  // Supabase always returns FK joins as arrays even for many-to-one.
  // Cast the raw result to reflect that, then collapse job to the first element.
  type RawApp = { id: string; applied_at: string; status: string; method: string | null; job: JobRef[] | null }
  const rawCast = (rawApplications as unknown as RawApp[]) ?? []
  const applications = rawCast
    .map((a): ApplicationRow => ({
      id: a.id,
      applied_at: a.applied_at,
      status: a.status,
      method: a.method,
      job: a.job?.[0] ?? null,
    }))
    .filter((a): a is ApplicationRow & { job: JobRef } => !!a.job && !a.job.deleted_at)

  // Derive display status from jobs.status (canonical outcome field)
  const displayStatus = (app: ApplicationRow): string => {
    const jobStatus = app.job?.status ?? "applied"
    if (jobStatus === "interviewing" || jobStatus === "offered" || jobStatus === "rejected") return jobStatus
    return "applied"
  }

  const counts = {
    applied:      applications.filter(a => displayStatus(a) === "applied").length,
    interviewing: applications.filter(a => displayStatus(a) === "interviewing").length,
    offered:      applications.filter(a => displayStatus(a) === "offered").length,
    rejected:     applications.filter(a => displayStatus(a) === "rejected").length,
  }
  const conversionRate = applications.length > 0
    ? Math.round(((counts.interviewing + counts.offered) / applications.length) * 100)
    : null

  const statusOrder = ["offered", "interviewing", "applied", "rejected"] as const
  const grouped = statusOrder.reduce((acc, s) => {
    acc[s] = applications.filter(a => displayStatus(a) === s)
    return acc
  }, {} as Record<string, ApplicationRow[]>)

  const groupLabels: Record<string, string> = {
    offered: "Offers",
    interviewing: "Interviewing",
    applied: "Applied",
    rejected: "Rejected",
  }

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Outcome Tracker</p>
          <h1 className="hw-page-title">Applications</h1>
          <p className="hw-page-subtitle">Every application you&apos;ve submitted — tracked from send to outcome.</p>
        </div>
        <Link href="/ready-to-apply">
          <Button size="sm" variant="outline" className="gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" /> Ready to Apply
          </Button>
        </Link>
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-600">{counts.applied}</span>
          <span className="hw-stat-label">Applied</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-500">{counts.interviewing}</span>
          <span className="hw-stat-label">Interviewing</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{counts.offered}</span>
          <span className="hw-stat-label">Offered</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-rose-500">{counts.rejected}</span>
          <span className="hw-stat-label">Rejected</span>
        </div>
        {conversionRate !== null && (
          <div className="hw-stat">
            <span className="hw-stat-value">{conversionRate}%</span>
            <span className="hw-stat-label">Interview rate</span>
          </div>
        )}
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        <div className="hw-workspace-main">
          {applications.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No applications yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Applications appear here when you submit through the readiness gate. Start by reviewing Ready to Apply and launching your strongest packages.
                </p>
              </div>
              <Link href="/ready-to-apply">
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" /> Go to Ready to Apply
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {statusOrder.map(status => {
                const group = grouped[status]
                if (group.length === 0) return null
                const Icon = STATUS_ICONS[status] ?? Send
                return (
                  <div key={status}>
                    <h2 className="hw-section-label mb-2">{groupLabels[status]}</h2>
                    <div className="space-y-2">
                      {group.map(app => {
                        const job = app.job
                        if (!job) return null
                        const ds = displayStatus(app)
                        return (
                          <Link key={app.id} href={`/jobs/${job.id}`} className="block group">
                            <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  ds === "offered" ? "bg-violet-50" :
                                  ds === "interviewing" ? "bg-blue-50" :
                                  ds === "applied" ? "bg-blue-50" : "bg-rose-50"
                                }`}>
                                  <Icon className={`h-4 w-4 ${
                                    ds === "offered" ? "text-violet-600" :
                                    ds === "interviewing" ? "text-blue-500" :
                                    ds === "applied" ? "text-blue-600" : "text-rose-500"
                                  }`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {job.role_title ?? "Untitled role"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {job.company_name ?? "—"}
                                    {app.method && app.method !== "manual" && (
                                      <span className="ml-1.5 text-muted-foreground/60">via {app.method}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <Badge variant="outline" className={`text-[10px] font-medium ${STATUS_CLASS[ds] ?? "status-draft"}`}>
                                  {STATUS_LABEL[ds] ?? ds}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground hidden sm:block">{timeAgo(app.applied_at)}</span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="hw-workspace-rail">
          <div>
            <h2 className="hw-section-label mb-3">About Applications</h2>
            <div className="hw-panel p-4 space-y-3 text-xs text-muted-foreground">
              <p>Applications are created when you submit through the <Link href="/ready-to-apply" className="text-primary hover:underline">readiness gate</Link>.</p>
              <p>Outcomes (interviewing, offered, rejected) are updated from each job detail page.</p>
              <p className="text-[11px]">Each row here traces back to a confirmed submission — no silent state changes.</p>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Quick Links</h2>
            <div className="space-y-2">
              {[
                { href: "/ready-to-apply", icon: CheckSquare, label: "Ready to Apply", desc: "Submit your next package" },
                { href: "/jobs",           icon: Send,         label: "Pipeline",       desc: "All jobs in progress" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="hw-card px-3.5 py-3 flex items-center gap-3 group">
                    <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
