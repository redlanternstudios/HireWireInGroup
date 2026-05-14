"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HireWireLogo } from "@/components/hirewire-logo"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  FileText,
  User,
  Settings,
  Grid2X2,
  CheckSquare,
  Send,
  SlidersHorizontal,
  History,
  BarChart3,
  PlusCircle,
  Sparkles,
  Library,
  CreditCard,
  Zap,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { DiagonalStripes } from "@/components/off-white-stripes"
import { cn } from "@/lib/utils"

// Pipeline navigation - main workflow
// NOTE: Removed placeholder pages that aren't wired (Companies, Templates)
const pipelineNav = [
  { name: "Home", href: "/dashboard", icon: Grid2X2 },
  { name: "Coach", href: "/coach", icon: Sparkles, premium: true },
  { name: "All Jobs", href: "/jobs", icon: Briefcase },
  { name: "Ready to Apply", href: "/ready-to-apply", icon: CheckSquare },
  { name: "Applied", href: "/applications", icon: Send },
  { name: "Materials", href: "/documents", icon: FileText },
  { name: "Career Context", href: "/evidence", icon: Library },
  { name: "Analytics", href: "/analytics", icon: BarChart3, premium: true },
  { name: "Activity Log", href: "/logs", icon: History },
  { name: "Add Job", href: "/jobs", icon: PlusCircle },
]

// Bottom navigation - settings/profile
const bottomNav = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  const renderNavItem = (item: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; premium?: boolean }) => {
    const isActive = pathname === item.href ||
      (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(item.href))
    return (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            "h-9 px-3 rounded-lg transition-all relative",
            isActive
              ? "bg-primary/8 text-foreground font-semibold border border-primary/12"
              : "hover:bg-accent/60"
          )}
        >
          <Link href={item.href}>
            <item.icon className={cn(
              "h-4 w-4 shrink-0",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn("text-sm flex-1", isActive ? "text-foreground" : "text-foreground/80")}>{item.name}</span>
            {item.premium && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold text-primary border-primary/30 bg-primary/5">
                PRO
              </Badge>
            )}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-6 pb-4 relative overflow-hidden">
        {/* Subtle diagonal stripe watermark — top-left only, very low opacity */}
        <DiagonalStripes position="top-left" size="sm" variant="black" opacity={0.06} />

        <Link href="/dashboard" className="flex items-start relative z-10" style={{ filter: "drop-shadow(0 0 18px rgba(216,0,0,0.08))" }}>
          <HireWireLogo variant="color" size="lg" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        {/* Pipeline Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-3">
            Pipeline
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pipelineNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="px-3 pb-4">
        {/* Bottom nav items */}
        <SidebarMenu className="border-t border-sidebar-border pt-3">
          {bottomNav.map(renderNavItem)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
