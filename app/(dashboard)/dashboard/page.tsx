import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LinkedInImportWidget } from "@/components/dashboard/LinkedInImportWidget"
import { getProfileLinks } from "@/lib/actions/profile-links"
import { Plus, Briefcase, CheckSquare, Send, FileText, TrendingUp, Sparkles, ArrowRight } from "lucide-react"

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: jobs }, profileLinksResult] = await Promise.all([
    supabase.from("user_profile").select("full_name, onboarding_complete, headline").eq("user_id", user.id).maybeSingle(),
    supabase.from("jobs").select("id, role_title, company_name, status, generation_status, created_at").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(6),
    getProfileLinks(),
  ])

  if (!profile || profile.onboarding_complete === false) redirect("/onboarding")

  const jobList = jobs ?? []
  const readyCount = jobList.filter(j => j.generation_status === "complete" || j.status === "ready").length
  const appliedCount = jobList.filter(j => ["applied", "interviewing", "offered"].includes(j.status)).length
  const profileLinks = (profileLinksResult as { links?: unknown[] })?.links ?? []
  const firstName = profile.full_name?.split(" ")[0] ?? "there"

  return (
    <div className="hw-page">
      {/* Header */}
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Good morning, {firstName}.</h1>
          <p className="hw-page-subtitle">{profile.headline ?? "Your career operating system."}</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="hw-stat"><span className="hw-stat-value">{jobList.length}</span><span className="hw-stat-label">Jobs tracked</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-emerald-600">{readyCount}</span><span className="hw-stat-label">Ready to apply</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-blue-600">{appliedCount}</span><span className="hw-stat-label">Applied</span></div>
        <div className="hw-stat"><span className="hw-stat-value">{profileLinks.length}</span><span className="hw-stat-label">Profile links</span></div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent jobs — 2 cols */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Recent Jobs</h2>
            <Link href="/jobs" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {jobList.length === 0 ? (
            <div className="hw-empty">
              <Briefcase className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">No jobs yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add your first job to get started.</p>
              </div>
              <Link href="/jobs/new"><Button size="sm" className="hw-btn-primary gap-1.5 mt-1"><Plus className="h-3.5 w-3.5" /> Add Job</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobList.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                  <div className="hw-card px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{job.role_title}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] font-medium ${STATUS_CLASS[job.status] ?? "status-draft"}`}>
                        {STATUS_LABEL[job.status] ?? job.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">{timeAgo(job.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions — 1 col */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/ready-queue", icon: CheckSquare, label: "Ready to Apply", sub: `${readyCount} ready`, color: "text-emerald-600" },
              { href: "/coach", icon: Sparkles, label: "Career Coach", sub: "Ask anything", color: "text-primary" },
              { href: "/analytics", icon: TrendingUp, label: "Analytics", sub: "Your progress", color: "text-blue-600" },
              { href: "/applications", icon: Send, label: "Applications", sub: `${appliedCount} in progress`, color: "text-blue-500" },
              { href: "/documents", icon: FileText, label: "Materials", sub: "Docs & resumes", color: "text-muted-foreground" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="hw-card px-3 py-2.5 flex items-center gap-3 group">
                  <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Import */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Import Profile</h2>
        <div className="hw-card p-5">
          <LinkedInImportWidget />
        </div>
      </div>
    </div>
  )
}
