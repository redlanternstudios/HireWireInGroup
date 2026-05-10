import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function VerificationHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch last 10 verification checks for this user
  const { data: checks } = await supabase
    .from("career_verification_checks")
    .select("claim_text, org_name, check_result, confidence, checked_at")
    .eq("user_id", user.id)
    .order("checked_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verification Simulator History</h1>
        <p className="text-sm text-muted-foreground">Recent employer-perspective verification checks.</p>
      </div>
      {checks && checks.length > 0 ? (
        <div className="space-y-2">
          {checks.map((c, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">{c.claim_text}</div>
              <div className="text-xs">Org: {c.org_name || "N/A"}</div>
              <div className={
                c.check_result === "verifiable"
                  ? "text-success"
                  : c.check_result === "unclear"
                  ? "text-warning"
                  : "text-destructive"
              }>
                {c.check_result.toUpperCase()} ({(c.confidence * 100).toFixed(0)}% confidence)
              </div>
              <div className="text-xs text-muted-foreground mt-1">Checked: {new Date(c.checked_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">No verification checks found.</div>
      )}
    </div>
  )
}
