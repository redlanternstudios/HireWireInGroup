import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VerificationSimulator } from "../IntegrityCheckers"
import { isAnthropicConfigured } from "@/lib/ai/gateway"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employer Verification Simulator</h1>
        <p className="text-sm text-muted-foreground">See what an employer&apos;s background check might flag in your resume.</p>
      </div>
      <VerificationSimulator aiEnabled={isAnthropicConfigured()} />
    </div>
  )
}
