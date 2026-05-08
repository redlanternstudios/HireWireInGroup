import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Profile</p>
            <p className="text-sm text-muted-foreground mt-0.5">Update your name, location, and summary</p>
          </div>
          <Link
            href="/profile"
            className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Edit profile
          </Link>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Billing</p>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your plan and payment method</p>
          </div>
          <Link
            href="/billing"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Manage billing
          </Link>
        </div>
      </div>
    </div>
  )
}
