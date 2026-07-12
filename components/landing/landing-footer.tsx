import Link from "next/link"
import { HireWireLogo } from "@/components/hirewire-logo"

export function LandingFooter() {
  return (
    <footer style={{ backgroundColor: "#7B1212" }} className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-24">
          <HireWireLogo variant="light" size="sm" />
        </div>

        <nav className="flex items-center gap-6 text-xs text-white/40">
          <Link href="/landing" className="hover:text-white/70 transition-colors">Home</Link>
          <a href="mailto:support@hirewire.ai" className="hover:text-white/70 transition-colors">Support</a>
        </nav>

        <p className="text-xs text-white/25 font-mono">
          &copy; {new Date().getFullYear()} HireWire
        </p>
      </div>
    </footer>
  )
}
