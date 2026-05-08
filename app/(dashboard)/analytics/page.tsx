import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your job search performance over time.</p>
        </div>
        <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold text-primary border-primary/30">
          PRO
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium">Coming soon</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Application funnel metrics, fit score trends, and response rate tracking — available on the Pro plan.
        </p>
        <a
          href="/billing"
          className="mt-6 inline-flex rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    </div>
  )
}
