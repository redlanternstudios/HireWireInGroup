import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GapAnalyzer } from "../IntegrityCheckers"
import { isAnthropicConfigured } from "@/lib/ai/gateway"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function GapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job-to-Profile Reality Gap Analyzer</h1>
        <p className="text-sm text-muted-foreground">See which job requirements are a fit, stretch, or reach for your profile.</p>
      </div>
      <GapAnalyzer aiEnabled={isAnthropicConfigured()} />
    </div>
  )
}
