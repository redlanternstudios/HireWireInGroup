import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, generated_resume, generation_timestamp, created_at")
    .eq("user_id", user.id)
    .not("generated_resume", "is", null)
    .is("deleted_at", null)
    .order("generation_timestamp", { ascending: false })
    .limit(50)

  const jobList = jobs ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materials</h1>
        <p className="text-muted-foreground mt-1">
          All generated resumes and cover letters across your jobs.
        </p>
      </div>

      {jobList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center gap-4">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No documents generated yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a job and run document generation to see your materials here.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-lg bg-[#7B1212] px-4 py-2 text-sm font-medium text-white hover:bg-[#6a0f0f] transition-colors"
          >
            Add a job
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {jobList.map((job) => (
            <div key={job.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{job.role_title ?? "Untitled role"}</p>
                <p className="text-sm text-muted-foreground truncate">{job.company_name ?? "—"}</p>
                {job.generation_timestamp && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated {new Date(job.generation_timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Link
                href={`/jobs/${job.id}/documents`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shrink-0"
              >
                <FileText className="h-3.5 w-3.5" />
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
