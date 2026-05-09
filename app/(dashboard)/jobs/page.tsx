import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JobInputForm } from "./JobInputForm"
import { Briefcase, Plus, FileText, ArrowRight } from "lucide-react"

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

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">All Jobs</h1>
          <p className="hw-page-subtitle">Every opportunity in your pipeline.</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="hw-stat"><span className="hw-stat-value">{jobList.length}</span><span className="hw-stat-label">Total</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-amber-600">{analyzing}</span><span className="hw-stat-label">Processing</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-emerald-600">{ready}</span><span className="hw-stat-label">Ready</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-blue-600">{applied}</span><span className="hw-stat-label">Applied</span></div>
      </div>

      {/* Add job */}
      <div className="hw-card p-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Analyze a Job</h2>
        <JobInputForm />
      </div>

      {/* Job list */}
      {jobList.length === 0 ? (
        <div className="hw-empty">
          <Briefcase className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No jobs tracked yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Paste a job posting above to get started.</p>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Your Jobs</h2>
          <div className="space-y-2">
            {jobList.map(job => {
              const isReady = job.generation_status === "complete" || !!job.generated_resume
              return (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                  <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
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
                          className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" /> Docs
                        </Link>
                      )}
                      <Badge variant="outline" className={`text-[10px] font-medium ${STATUS_CLASS[job.status] ?? "status-draft"}`}>
                        {STATUS_LABEL[job.status] ?? job.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground hidden md:block">{timeAgo(job.created_at)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
