import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function IntegrityHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch last 10 integrity checks for this user
  const { data: scores } = await supabase
    .from("career_integrity_scores")
    .select("bullet_text, risk_score, risk_level, flag_reason, suggested_rewrite, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resume Integrity History</h1>
        <p className="text-sm text-muted-foreground">Recent integrity checks and flagged bullets.</p>
      </div>
      {scores && scores.length > 0 ? (
        <div className="space-y-2">
          {scores.map((s, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{s.bullet_text}</div>
              <div className="text-xs">{s.risk_level.toUpperCase()} ({(s.risk_score * 100).toFixed(0)}%) — {s.flag_reason}</div>
              {s.suggested_rewrite && <div className="text-xs text-primary mt-1">Suggested: {s.suggested_rewrite}</div>}
              <div className="text-xs text-muted-foreground mt-1">Checked: {new Date(s.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">No integrity checks found.</div>
      )}
    </div>
  )
}
