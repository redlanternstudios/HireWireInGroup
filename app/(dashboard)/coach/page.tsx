import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch open coach sessions
  const { data: sessions } = await supabase
    .from("coach_sessions")
    .select("id, gap_requirement, status, created_at, job_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10)

  const activeSessions = sessions ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coach</h1>
          <p className="text-muted-foreground mt-1">Your AI career coach for gap-filling and interview prep.</p>
        </div>
        <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold text-primary border-primary/30">
          PRO
        </Badge>
      </div>

      {activeSessions.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-medium">Active sessions</h2>
          </div>
          <ul className="divide-y divide-border">
            {activeSessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <p className="text-sm font-medium truncate flex-1">{session.gap_requirement}</p>
                <Link
                  href={`/jobs/${session.job_id}`}
                  className="inline-flex items-center rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800 transition-colors shrink-0"
                >
                  Resume session
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-base font-medium">No active coaching sessions</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Coach sessions start from a job's evidence-match page when gaps are identified. Analyze a job to get started.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Analyze a job
          </Link>
        </div>
      )}
    </div>
  )
}
