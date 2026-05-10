import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, FileText, ArrowRight, Plus } from "lucide-react"

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

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, generated_resume, generation_timestamp, created_at")
    .eq("user_id", user.id)
    .in("status", ["ready", "needs_review"])
    .is("deleted_at", null)
    .order("generation_timestamp", { ascending: false, nullsFirst: false })
    .limit(50)

  const jobList = jobs ?? []
  const readyCount = jobList.filter(j => j.status === "ready").length
  const reviewCount = jobList.filter(j => j.status === "needs_review").length

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Ready to Apply</h1>
          <p className="hw-page-subtitle">Jobs with generated materials ready to send.</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="hw-stat"><span className="hw-stat-value">{jobList.length}</span><span className="hw-stat-label">Total ready</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-emerald-600">{readyCount}</span><span className="hw-stat-label">Ready</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-amber-600">{reviewCount}</span><span className="hw-stat-label">Needs review</span></div>
      </div>

      {jobList.length === 0 ? (
        <div className="hw-empty">
          <CheckSquare className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">Nothing in the queue yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jobs appear here once documents are generated and ready to review.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" className="hw-btn-primary gap-1.5 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add a job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {jobList.map(job => (
            <div key={job.id} className="hw-card px-5 py-4 flex items-center justify-between gap-4">
              <Link href={`/jobs/${job.id}`} className="flex items-center gap-4 min-w-0 flex-1 group">
                <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
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
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${job.status === "ready" ? "status-ready" : "status-analyzing"}`}
                >
                  {job.status === "ready" ? "Ready" : "Needs review"}
                </Badge>
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
    </div>
  )
}
