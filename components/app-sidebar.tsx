"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HireWireLogo } from "@/components/hirewire-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Briefcase,
  FileText,
  User,
  Settings,
  Grid2X2,
  Send,
  History,
  BarChart3,
  Plus,
  Sparkles,
  Library,
  CreditCard,
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
import { DiagonalStripes, HazardTape } from "@/components/off-white-stripes"
import { cn } from "@/lib/utils"

// Primary nav — core hiring workflow
const primaryNav = [
  { name: "Home",          href: "/dashboard",    icon: Grid2X2 },
  { name: "Opportunities", href: "/jobs",          icon: Briefcase },
  { name: "Coach",         href: "/coach",         icon: Sparkles, premium: true },
  { name: "Documents",     href: "/documents",     icon: FileText },
  { name: "Applications",  href: "/applications",  icon: Send },
]

// Secondary nav — context and insights
const secondaryNav = [
  { name: "Career Context", href: "/evidence",     icon: Library },
  { name: "Insights",       href: "/analytics",    icon: BarChart3, premium: true },
  { name: "Activity Log",   href: "/logs",         icon: History },
]

// Footer nav — account
const footerNav = [
  { name: "Profile",  href: "/profile",  icon: User },
  { name: "Billing",  href: "/billing",  icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; premium?: boolean }

export function AppSidebar() {
  const pathname = usePathname()

  const renderNavItem = (item: NavItem) => {
    // /jobs active on exact match or any /jobs/* except /jobs/new
    const isActive =
      pathname === item.href ||
      (item.href === "/jobs" && pathname.startsWith("/jobs/") && pathname !== "/jobs/new") ||
      (item.href !== "/dashboard" && item.href !== "/" && item.href !== "/jobs" && pathname.startsWith(item.href))

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
            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
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
    <Sidebar className="border-r border-sidebar-border relative">
      {/* Off-White left-edge hazard stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[10px] z-50 pointer-events-none overflow-hidden">
        <HazardTape direction="vertical" variant="black" className="h-full w-full opacity-[0.09]" />
      </div>

      <SidebarHeader className="px-4 pt-6 pb-3 pl-6 relative overflow-hidden">
        <DiagonalStripes position="top-left" size="sm" variant="black" opacity={0.04} />
        <Link href="/dashboard" className="flex items-start relative z-10" style={{ filter: "drop-shadow(0 0 18px rgba(216,0,0,0.08))" }}>
          <HireWireLogo variant="color" size="lg" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="pl-4 pr-3">
        {/* Primary — core workflow */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-3">
            Workflow
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Add Job CTA */}
        <div className="px-2 pb-1">
          <Link href="/jobs?add=true">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 gap-1.5 text-xs font-semibold border-primary/25 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Job
            </Button>
          </Link>
        </div>

        {/* Secondary — context and insights */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-3">
            Context
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pl-4 pr-3 pb-4">
        <SidebarMenu className="border-t border-sidebar-border pt-3">
          {footerNav.map(renderNavItem)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
