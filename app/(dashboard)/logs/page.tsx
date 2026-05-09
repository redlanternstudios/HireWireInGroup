import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { History } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: events } = await supabase
    .from("processing_events")
    .select("id, event_type, status, message, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  const eventList = events ?? []

  const STATUS_COLORS: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          Processing events across all your jobs and documents.
        </p>
      </div>

      {eventList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center gap-4">
          <History className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Events will appear here as you analyze jobs and generate documents.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {eventList.map((event) => (
            <div key={event.id} className="flex items-start gap-4 px-6 py-4">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5 ${STATUS_COLORS[event.status] ?? "bg-gray-100 text-gray-700"}`}>
                {event.status}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{event.event_type}</p>
                {event.message && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{event.message}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
