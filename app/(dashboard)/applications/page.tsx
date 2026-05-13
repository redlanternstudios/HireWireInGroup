import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Send, ArrowRight, CheckSquare, MessageSquare,
  Trophy, XCircle, Clock, Target, Info,
} from "lucide-react"

export const dynamic = "force-dynamic"

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

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, created_at")
    .eq("user_id", user.id)
    .in("status", ["applied", "interviewing", "offered", "rejected"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50)

  const jobList = jobs ?? []
  const counts = {
    applied: jobList.filter(j => j.status === "applied").length,
    interviewing: jobList.filter(j => j.status === "interviewing").length,
    offered: jobList.filter(j => j.status === "offered").length,
    rejected: jobList.filter(j => j.status === "rejected").length,
  }

  const activeCount = counts.applied + counts.interviewing + counts.offered
  const conversionRate = jobList.length > 0
    ? Math.round(((counts.interviewing + counts.offered) / jobList.length) * 100)
    : null

  // Group by status for ordered display
  const statusOrder: Array<keyof typeof counts> = ["offered", "interviewing", "applied", "rejected"]
  const grouped = statusOrder.reduce((acc, s) => {
    acc[s] = jobList.filter(j => j.status === s)
    return acc
  }, {} as Record<string, typeof jobList>)

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Outcome Tracker</p>
          <h1 className="hw-page-title">Applications</h1>
          <p className="hw-page-subtitle">Every application you&apos;ve submitted — tracked from send to outcome.</p>
        </div>
        <Link href="/ready-queue">
          <Button size="sm" variant="outline" className="gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" /> Ready Queue
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
        {/* Main */}
        <div className="hw-workspace-main">
          {jobList.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No applications yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Applications appear here when you mark a job as &quot;Applied&quot; from its detail page. Start by reviewing your ready queue and launching your strongest packages.
                </p>
              </div>
              <Link href="/ready-queue">
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" /> Go to Ready Queue
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {statusOrder.map(status => {
                const group = grouped[status]
                if (group.length === 0) return null
                const Icon = STATUS_ICONS[status] ?? Send
                const groupLabels: Record<string, string> = {
                  offered: "Offers",
                  interviewing: "Interviewing",
                  applied: "Applied",
                  rejected: "Rejected",
                }
                return (
                  <div key={status}>
                    <h2 className="hw-section-label mb-2">{groupLabels[status]}</h2>
                    <div className="space-y-2">
                      {group.map(job => (
                        <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                          <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                status === "offered" ? "bg-violet-50" :
                                status === "interviewing" ? "bg-blue-50" :
                                status === "applied" ? "bg-blue-50" : "bg-rose-50"
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  status === "offered" ? "text-violet-600" :
                                  status === "interviewing" ? "text-blue-500" :
                                  status === "applied" ? "text-blue-600" : "text-rose-500"
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {job.role_title ?? "Untitled role"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{job.company_name ?? "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant="outline" className={`text-[10px] font-medium ${STATUS_CLASS[job.status] ?? "status-draft"}`}>
                                {STATUS_LABEL[job.status] ?? job.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground hidden sm:block">{timeAgo(job.created_at)}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="hw-workspace-rail">
          {/* How it works */}
          <div>
            <h2 className="hw-section-label mb-3">How This Works</h2>
            <div className="hw-panel p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Jobs move here when you mark them as Applied from the job detail page. Update the status as your application progresses.
              </p>
              <div className="space-y-2 pt-1">
                {[
                  { stage: "Applied", hint: "Package submitted" },
                  { stage: "Interviewing", hint: "Screens or rounds active" },
                  { stage: "Offered", hint: "Offer received" },
                  { stage: "Rejected", hint: "Process ended" },
                ].map(item => (
                  <div key={item.stage} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <p className="text-xs text-foreground font-medium">{item.stage}</p>
                    <p className="text-[11px] text-muted-foreground">— {item.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Follow up guidance */}
          {activeCount > 0 && (
            <div className="mt-4">
              <h2 className="hw-section-label mb-2">Follow-up Guidance</h2>
              <div className="hw-panel p-4">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Timing matters</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Follow up 5–7 business days after applying. For interviews, send a thank-you within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next action */}
          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Next Best Action</h2>
            {counts.interviewing > 0 ? (
              <div className="hw-next-action">
                <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Prep for your interview{counts.interviewing > 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Use the Career Coach for targeted interview preparation.</p>
                  <Link href="/coach" className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                    Open Coach <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : counts.applied > 0 ? (
              <div className="hw-next-action">
                <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Follow up on applications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have {counts.applied} active application{counts.applied !== 1 ? "s" : ""}. Consider a follow-up if it&apos;s been 5+ days.
                  </p>
                </div>
              </div>
            ) : (
              <Link href="/ready-queue">
                <div className="hw-next-action group">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Launch applications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Visit the Ready Queue to submit your prepared packages.</p>
                    <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Go to Ready Queue <ArrowRight className="h-3 w-3" />
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
