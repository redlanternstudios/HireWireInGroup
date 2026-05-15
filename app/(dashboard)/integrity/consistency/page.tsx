import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ConsistencyChecker } from "../IntegrityCheckers"
import { isAnthropicConfigured } from "@/lib/adapters/anthropic"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ConsistencyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LinkedIn ↔ Resume Consistency</h1>
        <p className="text-sm text-muted-foreground">Check for contradictions between your resume and LinkedIn profile.</p>
      </div>
      <ConsistencyChecker aiEnabled={isAnthropicConfigured()} />
    </div>
  )
}
