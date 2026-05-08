import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, generated_resume, generated_cover_letter, last_edited_at, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .not("generated_resume", "is", null)
    .order("created_at", { ascending: false })
    .limit(50)

  const jobsWithDocs = jobs ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materials</h1>
        <p className="text-muted-foreground mt-1">All generated resumes and cover letters.</p>
      </div>

      {jobsWithDocs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No documents yet. Analyze a job and generate documents to see them here.</p>
          <Link href="/jobs" className="mt-4 inline-flex rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
            Analyze a job
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-medium">Generated documents</h2>
          </div>
          <ul className="divide-y divide-border">
            {jobsWithDocs.map((job) => {
              const docDate = new Date(job.last_edited_at ?? job.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              return (
                <li key={job.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{job.role_title ?? "Untitled role"}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {job.company_name ?? "—"} · {docDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.generated_cover_letter && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Cover letter
                      </span>
                    )}
                    <Link
                      href={`/jobs/${job.id}/documents`}
                      className="inline-flex items-center rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
