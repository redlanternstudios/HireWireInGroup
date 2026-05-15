import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AIContentChecker } from "../IntegrityCheckers"
import { isAnthropicConfigured } from "@/lib/adapters/anthropic"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AIContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI-Generated Content Detector</h1>
        <p className="text-sm text-muted-foreground">Detect and flag AI-generated or generic language in your resume.</p>
      </div>
      <AIContentChecker aiEnabled={isAnthropicConfigured()} />
    </div>
  )
}
