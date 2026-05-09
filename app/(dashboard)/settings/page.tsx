"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Trash2, Loader2, User, CreditCard, ChevronRight } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="hw-page max-w-2xl">
      <div>
        <h1 className="hw-page-title">Settings</h1>
        <p className="hw-page-subtitle">Manage your account preferences.</p>
      </div>

      <div className="space-y-2">
        {/* Account section */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3">Account</p>

        <button
          onClick={() => router.push("/profile")}
          className="hw-card w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">Update your name, location, and contact info.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        <button
          onClick={() => router.push("/billing")}
          className="hw-card w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Billing</p>
              <p className="text-xs text-muted-foreground">Manage your subscription and payment details.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        {/* Session section */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3 mt-6">Session</p>

        <div className="hw-card px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs text-muted-foreground">End your current session on this device.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <LogOut className="h-3.5 w-3.5 mr-1.5" />}
            Sign out
          </Button>
        </div>

        {/* Danger zone */}
        <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest px-1 mb-3 mt-6">Danger Zone</p>

        <div className="hw-card px-5 py-4 flex items-center justify-between gap-4 border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently remove your account and all data. Cannot be undone.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
            onClick={() => alert("Please contact support to delete your account.")}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
