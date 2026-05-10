import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowRight, CheckSquare } from "lucide-react"

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

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Applications</h1>
          <p className="hw-page-subtitle">Every application you&apos;ve submitted.</p>
        </div>
        <Link href="/ready-queue">
          <Button size="sm" variant="outline" className="gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" /> Ready Queue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="hw-stat"><span className="hw-stat-value text-blue-600">{counts.applied}</span><span className="hw-stat-label">Applied</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-blue-500">{counts.interviewing}</span><span className="hw-stat-label">Interviewing</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-emerald-600">{counts.offered}</span><span className="hw-stat-label">Offered</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-rose-500">{counts.rejected}</span><span className="hw-stat-label">Rejected</span></div>
      </div>

      {jobList.length === 0 ? (
        <div className="hw-empty">
          <Send className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No applications yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark a job as &quot;Applied&quot; from its detail page to track it here.
            </p>
          </div>
          <Link href="/ready-queue">
            <Button size="sm" className="hw-btn-primary gap-1.5 mt-1">
              View ready queue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {jobList.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
              <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Send className="h-4 w-4 text-muted-foreground shrink-0" />
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
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
