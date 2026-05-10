import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { EmptyWithAction } from "@/components/error/empty-with-action"
import { getClientMessage } from "@/lib/comms/client-messages"
import Link from "next/link"
import { CheckSquare, FileText } from "lucide-react"

export const dynamic = "force-dynamic"

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
    .order("generation_timestamp", { ascending: false })
    .limit(50)

  const jobList = jobs ?? []

  const emptyMsg = getClientMessage('readyQueue.empty')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ready to Apply</h1>
        <p className="text-muted-foreground mt-1">
          Jobs with generated documents that are ready to send.
        </p>
      </div>

      {jobList.length === 0 ? (
        emptyMsg ? (
          <EmptyWithAction
            message={emptyMsg.body}
            actionLabel={emptyMsg.actionLabel || "Add Job"}
            onAction={() => { window.location.href = emptyMsg.nextAction || "/jobs" }}
          />
        ) : null
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {jobList.map((job) => (
            <div key={job.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{job.role_title ?? "Untitled role"}</p>
                <p className="text-sm text-muted-foreground truncate">{job.company_name ?? "—"}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  job.status === "ready" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {job.status === "ready" ? "Ready" : "Needs review"}
                </span>
                <Link
                  href={`/jobs/${job.id}/documents`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View documents
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
