import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { humanizeJobStatus } from "@/lib/humanizer"

export const dynamic = "force-dynamic"

export default async function ActivityLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, created_at, updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50)

  const jobList = jobs ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Recent changes to your job pipeline.</p>
      </div>

      {jobList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No activity yet. Add your first job to get started.</p>
          <Link href="/jobs" className="mt-4 inline-flex rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
            Go to Jobs
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-medium">Recent activity</h2>
          </div>
          <ul className="divide-y divide-border">
            {jobList.map((job) => {
              const { label, color } = humanizeJobStatus(job.status)
              const updatedAt = new Date(job.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              return (
                <li key={job.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1 hover:opacity-70 transition-opacity">
                    <p className="font-medium text-sm truncate">{job.role_title ?? "Untitled role"}</p>
                    <p className="text-sm text-muted-foreground truncate">{job.company_name ?? "—"} · {updatedAt}</p>
                  </Link>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${color}`}>
                    {label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
