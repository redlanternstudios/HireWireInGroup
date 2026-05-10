import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ConsistencyHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch last 10 consistency flags for this user
  const { data: flags } = await supabase
    .from("career_consistency_flags")
    .select("field, value_a, value_b, severity, delta, flagged_at")
    .eq("user_id", user.id)
    .order("flagged_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consistency Check History</h1>
        <p className="text-sm text-muted-foreground">Recent LinkedIn ↔ Resume contradictions.</p>
      </div>
      {flags && flags.length > 0 ? (
        <div className="space-y-2">
          {flags.map((f, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{f.field}</div>
              <div className="text-xs">Resume: {f.value_a} | LinkedIn: {f.value_b}</div>
              <div className={f.severity === "disqualifying" ? "text-destructive" : "text-warning"}>{f.severity.toUpperCase()} — {f.delta}</div>
              <div className="text-xs text-muted-foreground mt-1">Flagged: {new Date(f.flagged_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">No consistency flags found.</div>
      )}
    </div>
  )
}
