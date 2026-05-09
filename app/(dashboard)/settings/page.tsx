"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, Trash2, Loader2 } from "lucide-react"

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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences.
        </p>
      </div>

      <div className="border border-border rounded-lg bg-card divide-y divide-border">
        {/* Account */}
        <div className="p-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Account</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Profile</p>
              <p className="text-sm text-muted-foreground">Update your name, location, and contact info.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/profile")}>
              Edit profile
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Billing</p>
              <p className="text-sm text-muted-foreground">Manage your subscription and payment details.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/billing")}>
              Manage billing
            </Button>
          </div>
        </div>

        {/* Session */}
        <div className="p-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Session</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-sm text-muted-foreground">End your current session on this device.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <LogOut className="h-4 w-4 mr-1.5" />
              )}
              Sign out
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="p-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-red-500 font-mono">Danger zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">Permanently remove your account and all data. This cannot be undone.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => alert("Please contact support to delete your account.")}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
