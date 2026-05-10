import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function GapHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch last 10 gap analyses for this user (if table exists)
  // Placeholder: If not yet persisted, show empty state
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gap Analyzer History</h1>
        <p className="text-sm text-muted-foreground">Recent job-to-profile gap analyses.</p>
      </div>
      <div className="text-muted-foreground text-xs">No gap analysis history yet.</div>
    </div>
  )
}
