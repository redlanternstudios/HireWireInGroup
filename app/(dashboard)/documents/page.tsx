import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Plus, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, generated_resume, generated_cover_letter, generation_timestamp, created_at")
    .eq("user_id", user.id)
    .not("generated_resume", "is", null)
    .is("deleted_at", null)
    .order("generation_timestamp", { ascending: false, nullsFirst: false })
    .limit(50)

  const jobList = jobs ?? []

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Materials</h1>
          <p className="hw-page-subtitle">All generated resumes and cover letters.</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="hw-stat"><span className="hw-stat-value">{jobList.length}</span><span className="hw-stat-label">Jobs with docs</span></div>
        <div className="hw-stat"><span className="hw-stat-value">{jobList.filter(j => j.generated_cover_letter).length}</span><span className="hw-stat-label">Cover letters</span></div>
      </div>

      {jobList.length === 0 ? (
        <div className="hw-empty">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No documents generated yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a job and run document generation to see your materials here.
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
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {job.role_title ?? "Untitled role"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {job.company_name ?? "—"}
                    {job.generation_timestamp && (
                      <span className="hidden sm:inline"> · {formatDate(job.generation_timestamp)}</span>
                    )}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {job.generated_cover_letter && (
                  <span className="text-[10px] text-muted-foreground hidden sm:block border border-border rounded px-1.5 py-0.5">
                    + Cover letter
                  </span>
                )}
                <Link
                  href={`/jobs/${job.id}/documents`}
                  className="inline-flex items-center gap-1.5 hw-card px-3 py-1.5 text-xs font-medium hover:border-primary/30 transition-colors"
                >
                  View <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
