import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("plan_type")
    .eq("id", user.id)
    .single()

  const plan = userData?.plan_type ?? "free"
  const isPro = plan === "pro"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and usage.</p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-medium">Current plan</h2>
        </div>
        <div className="px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold capitalize">{plan}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPro
                ? "Unlimited document generation and all PRO features"
                : "5 document generations per month"}
            </p>
          </div>
          {!isPro && (
            <a
              href="/api/stripe/checkout"
              className="rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
