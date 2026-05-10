
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { History } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { getClientMessage } from "@/lib/comms/client-messages"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Unified activity log: career_activity_log (fallback: processing_events if empty)
  let { data: events } = await supabase
    .from("career_activity_log")
    .select("id, object_type, object_id, summary, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  let eventList = events ?? []

  // Fallback to processing_events if career_activity_log is empty (for legacy)
  if (eventList.length === 0) {
    const { data: legacyEvents } = await supabase
      .from("processing_events")
      .select("id, event_type, status, message, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
    eventList = legacyEvents ?? []
  }

  const STATUS_COLORS: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-700",
    default: "bg-gray-100 text-gray-700",
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
        (() => {
          const msg = getClientMessage('logs.empty')
          return (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History className="h-10 w-10 text-muted-foreground/40" />
                </EmptyMedia>
                <EmptyTitle>{msg?.subject}</EmptyTitle>
                <EmptyDescription>{msg?.body}</EmptyDescription>
              </EmptyHeader>
              {msg?.actionLabel && msg?.nextAction && (
                <EmptyContent>
                  <Button asChild variant="default">
                    <Link href={msg.nextAction}>{msg.actionLabel}</Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )
        })()
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {eventList.map((event) => {
            // career_activity_log: summary, object_type, object_id, metadata
            // processing_events: event_type, status, message, metadata
            const isLegacy = !!event.event_type
            const status = isLegacy ? event.status : (event.metadata?.status || "default")
            const title = isLegacy ? event.event_type : event.object_type
            const message = isLegacy ? event.message : event.summary
            return (
              <div key={event.id} className="flex items-start gap-4 px-6 py-4">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5 ${STATUS_COLORS[status] ?? STATUS_COLORS.default}`}>
                  {status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  {message && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{message}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
