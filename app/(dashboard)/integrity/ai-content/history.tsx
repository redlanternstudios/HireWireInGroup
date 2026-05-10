import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AIContentHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch last 10 AI content flags for this user
  const { data: flags } = await supabase
    .from("career_ai_content_flags")
    .select("section, ai_confidence_score, flagged_phrases, flagged_at")
    .eq("user_id", user.id)
    .order("flagged_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Content Detection History</h1>
        <p className="text-sm text-muted-foreground">Recent AI-generated content flags.</p>
      </div>
      {flags && flags.length > 0 ? (
        <div className="space-y-2">
          {flags.map((f, i) => (
            <div key={i} className="border rounded p-3 bg-muted">
              <div className="font-medium text-foreground">Section: {f.section}</div>
              <div className="text-xs">AI Confidence: {(f.ai_confidence_score * 100).toFixed(0)}%</div>
              {f.flagged_phrases && f.flagged_phrases.length > 0 && (
                <div className="text-warning text-xs mt-1">Flagged: {f.flagged_phrases.join(", ")}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">Flagged: {new Date(f.flagged_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">No AI content flags found.</div>
      )}
    </div>
  )
}
