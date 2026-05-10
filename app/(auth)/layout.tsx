import Link from "next/link"
import { HireWireLogo } from "@/components/hirewire-logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 gap-6">
      <Link href="/" aria-label="HireWire home">
        <HireWireLogo variant="color" size="md" />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} HireWire. All rights reserved.
      </p>
    </div>
  )
}
