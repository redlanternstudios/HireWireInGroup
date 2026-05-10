import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LinkedInImportWidget } from "@/components/dashboard/LinkedInImportWidget"
import { getProfileLinks } from "@/lib/actions/profile-links"
import {
  Plus, Briefcase, CheckSquare, Send, FileText, TrendingUp,
  Sparkles, ArrowRight, Target, BookOpen, Activity,
} from "lucide-react"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

const STATUS_CLASS: Record<string, string> = {
  draft: "status-draft", analyzing: "status-analyzing", analyzed: "status-analyzing",
  generating: "status-analyzing", ready: "status-ready", applied: "status-applied",
  interviewing: "status-applied", offered: "status-offered", rejected: "status-rejected",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", analyzing: "Analyzing", analyzed: "Analyzed", generating: "Generating",
  ready: "Ready", applied: "Applied", interviewing: "Interviewing", offered: "Offered", rejected: "Rejected",
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: jobs }, profileLinksResult] = await Promise.all([
    supabase.from("user_profile").select("full_name, onboarding_complete, headline").eq("user_id", user.id).maybeSingle(),
    supabase.from("jobs").select("id, role_title, company_name, status, generation_status, created_at").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(8),
    getProfileLinks(),
  ])

  if (!profile || profile.onboarding_complete === false) redirect("/onboarding")

  const jobList = jobs ?? []
  const readyCount = jobList.filter(j => j.generation_status === "complete" || j.status === "ready").length
  const appliedCount = jobList.filter(j => ["applied", "interviewing", "offered"].includes(j.status)).length
  const inProgressCount = jobList.filter(j => ["analyzing", "generating", "queued"].includes(j.status)).length
  const profileLinks = (profileLinksResult as { links?: unknown[] })?.links ?? []
  const firstName = profile.full_name?.split(" ")[0] ?? "there"

  const quickNav = [
    { href: "/ready-queue", icon: CheckSquare, label: "Ready to Apply", value: readyCount, valueColor: "text-emerald-600", desc: "packages awaiting launch" },
    { href: "/coach", icon: Sparkles, label: "Career Coach", value: null, valueColor: "text-primary", desc: "AI-powered career advice" },
    { href: "/analytics", icon: TrendingUp, label: "Analytics", value: null, valueColor: "text-blue-600", desc: "your search performance" },
    { href: "/applications", icon: Send, label: "Applications", value: appliedCount, valueColor: "text-blue-500", desc: "submitted" },
    { href: "/evidence", icon: BookOpen, label: "Career Context", value: profileLinks.length, valueColor: "text-muted-foreground", desc: "proof points" },
    { href: "/logs", icon: Activity, label: "Activity Log", value: null, valueColor: "text-muted-foreground", desc: "processing events" },
  ]

  return (
    <div className="hw-page">
      {/* ─── Page Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Command Center</p>
          <h1 className="hw-page-title">{greeting()}, {firstName}.</h1>
          <p className="hw-page-subtitle">{profile.headline ?? "Your career operating system — built on truth."}</p>
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
          <span className="hw-stat-label">Jobs tracked</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{readyCount}</span>
          <span className="hw-stat-label">Ready to apply</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{inProgressCount}</span>
          <span className="hw-stat-label">Processing</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-blue-600">{appliedCount}</span>
          <span className="hw-stat-label">Applied</span>
        </div>
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main — Recent Jobs */}
        <div className="hw-workspace-main">
          <div className="flex items-center justify-between mb-3">
            <h2 className="hw-section-label">Recent Jobs</h2>
            <Link href="/jobs" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {jobList.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No jobs tracked yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Add your first job posting to start building your pipeline. HireWire will analyze it against your career context.
                </p>
              </div>
              <Link href="/jobs/new">
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add your first job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobList.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                  <div className="hw-card px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
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
          )}

          {/* Import */}
          <div className="mt-2">
            <h2 className="hw-section-label mb-3">Import Profile</h2>
            <div className="hw-card p-5">
              <LinkedInImportWidget />
            </div>
          </div>
        </div>

        {/* Rail — Quick Navigation */}
        <div className="hw-workspace-rail">
          <h2 className="hw-section-label mb-3">Quick Navigation</h2>
          <div className="space-y-2">
            {quickNav.map(item => (
              <Link key={item.href} href={item.href}>
                <div className="hw-card px-4 py-3 flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <item.icon className={`h-3.5 w-3.5 ${item.valueColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.label}</p>
                      {item.value !== null && item.value > 0 && (
                        <span className={`text-xs font-bold tabular-nums ${item.valueColor}`}>{item.value}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {/* Next Best Action */}
          {readyCount > 0 && (
            <div className="mt-4">
              <h2 className="hw-section-label mb-2">Next Best Action</h2>
              <Link href="/ready-queue">
                <div className="hw-next-action group">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {readyCount} job{readyCount !== 1 ? "s" : ""} ready to send
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review your packages and submit your strongest applications.
                    </p>
                    <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Go to Ready Queue <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {jobList.length === 0 && (
            <div className="mt-4">
              <h2 className="hw-section-label mb-2">Next Best Action</h2>
              <Link href="/jobs/new">
                <div className="hw-next-action group">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Add your first job</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paste a job description to begin analysis.
                    </p>
                    <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Add Job <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
