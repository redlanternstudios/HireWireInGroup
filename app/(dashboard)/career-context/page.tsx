import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CareerContextOverview } from "./CareerContextOverview"
import { CareerContextCard } from "./CareerContextCard"
import { AddCareerContextModal } from "./AddCareerContextModal"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Tab taxonomy per CLAUDE.md Section 16
const TABS = [
  { key: "experience",   label: "Experience",           sourceTypes: ["work_experience"] },
  { key: "skills",       label: "Skills",               sourceTypes: ["skill"] },
  { key: "projects",     label: "Projects",             sourceTypes: ["project", "shipped_product", "portfolio_entry"] },
  { key: "education",    label: "Education & Learning", sourceTypes: ["education"] },
  { key: "certs",        label: "Certifications",       sourceTypes: ["certification"] },
  { key: "achievements", label: "Achievements",         sourceTypes: ["achievement"] },
  { key: "documents",    label: "Documents",            sourceTypes: ["document"] },
] as const

type TabKey = (typeof TABS)[number]["key"]

function computeProfileStrength(items: EvidenceItem[]): number {
  const workItems = items.filter((i) => i.source_type === "work_experience")
  const workWithOutcomes = workItems.filter(
    (i) => Array.isArray(i.outcomes) && i.outcomes.length > 0
  )
  const skills = items.filter((i) => i.source_type === "skill")
  const certs = items.filter((i) => i.source_type === "certification")
  const education = items.filter((i) => i.source_type === "education")
  const approved = items.filter((i) => i.is_user_approved)

  const workScore =
    workItems.length > 0
      ? (workWithOutcomes.length / workItems.length) * 0.3
      : 0
  const skillScore = skills.length > 5 ? 0.2 : 0
  const certScore = certs.length > 0 ? 0.15 : 0
  const eduScore = education.length > 0 ? 0.15 : 0
  const approvalScore =
    items.length > 0 ? (approved.length / items.length) * 0.2 : 0

  return Math.round(
    (workScore + skillScore + certScore + eduScore + approvalScore) * 100
  )
}

function computeAtsReadiness(items: EvidenceItem[]): "Strong" | "Medium" | "Weak" {
  const keywordCount = items.reduce((acc, item) => {
    const kw = Array.isArray(item.approved_keywords) ? item.approved_keywords : []
    return acc + kw.length
  }, 0)
  if (keywordCount >= 40) return "Strong"
  if (keywordCount >= 15) return "Medium"
  return "Weak"
}

function computeTopItems(items: EvidenceItem[], field: "tools_used" | "industries") {
  const freq: Record<string, number> = {}
  for (const item of items) {
    const arr = Array.isArray(item[field]) ? item[field] : []
    for (const val of arr as string[]) {
      freq[val] = (freq[val] ?? 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)
}

function getEarliestYear(items: EvidenceItem[]): number | null {
  const workItems = items.filter(
    (i) => i.source_type === "work_experience" && i.date_range
  )
  if (workItems.length === 0) return null
  const years = workItems
    .map((i) => {
      const match = i.date_range?.match(/\d{4}/)
      return match ? parseInt(match[0]) : null
    })
    .filter(Boolean) as number[]
  return years.length > 0 ? Math.min(...years) : null
}

function isCoreItem(item: EvidenceItem, evidenceMaps: string[][]): boolean {
  if (item.is_user_approved) return true
  if ((item.confidence_score ?? 0) >= 0.8) {
    return evidenceMaps.some((map) => map.includes(item.id))
  }
  return false
}

function groupByCompany(items: EvidenceItem[]) {
  const groups: Record<string, EvidenceItem[]> = {}
  for (const item of items) {
    const key = item.company_name ?? "Other"
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

// Types matching evidence_library schema
type EvidenceItem = {
  id: string
  source_type: string
  source_title: string | null
  company_name: string | null
  date_range: string | null
  confidence_score: number | null
  is_user_approved: boolean
  approved_keywords: string[] | null
  tools_used: string[] | null
  industries: string[] | null
  outcomes: string[] | null
  created_at: string
}

export default async function CareerContextPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch all evidence_library items — tenant isolated
  const { data: rawItems } = await supabase
    .from("evidence_library")
    .select(
      "id, source_type, source_title, company_name, date_range, confidence_score, is_user_approved, approved_keywords, tools_used, industries, outcomes, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const items: EvidenceItem[] = (rawItems ?? []).map((item) => ({
    ...item,
    approved_keywords: Array.isArray(item.approved_keywords)
      ? item.approved_keywords
      : [],
    tools_used: Array.isArray(item.tools_used) ? item.tools_used : [],
    industries: Array.isArray(item.industries) ? item.industries : [],
    outcomes: Array.isArray(item.outcomes) ? item.outcomes : [],
  }))

  // Fetch evidence_maps from jobs to determine Core status
  const { data: jobsWithMaps } = await supabase
    .from("jobs")
    .select("evidence_map")
    .eq("user_id", user.id)
    .is("deleted_at", null)

  const evidenceMaps: string[][] = (jobsWithMaps ?? [])
    .map((j) => (Array.isArray(j.evidence_map) ? j.evidence_map : []))

  // Compute overview metrics
  const profileStrength = computeProfileStrength(items)
  const atsReadiness = computeAtsReadiness(items)
  const topSkills = computeTopItems(items, "tools_used")
  const topIndustries = computeTopItems(items, "industries")
  const earliestYear = getEarliestYear(items)
  const yearsExperience =
    earliestYear ? new Date().getFullYear() - earliestYear : null

  // Core / Extended split
  const coreItems = items.filter((i) => isCoreItem(i, evidenceMaps))
  const extendedItems = items.filter((i) => !isCoreItem(i, evidenceMaps))

  // Active tab
  const activeTab = (searchParams.tab ?? "experience") as TabKey
  const activeTabDef = TABS.find((t) => t.key === activeTab) ?? TABS[0]

  // Filter items for active tab
  const tabItems = items.filter((i) =>
    (activeTabDef.sourceTypes as readonly string[]).includes(i.source_type)
  )

  // Group Experience tab by company
  const isExperienceTab = activeTab === "experience"
  const companyGroups = isExperienceTab ? groupByCompany(tabItems) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Career Context
          </h1>
          <p className="text-sm text-muted-foreground">
            Your verified professional evidence — the source of truth for every
            generated document.
          </p>
        </div>
        <AddCareerContextModal userId={user.id} />
      </div>

      {/* Overview Summary Card */}
      <CareerContextOverview
        totalItems={items.length}
        coreCount={coreItems.length}
        extendedCount={extendedItems.length}
        yearsExperience={yearsExperience}
        topSkills={topSkills}
        topIndustries={topIndustries}
        profileStrength={profileStrength}
        atsReadiness={atsReadiness}
      />

      {/* Core / Extended toggle summary */}
      {items.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">{coreItems.length} Core</span>
            <span className="text-muted-foreground">
              — proven generation signal
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
            <span className="font-medium">{extendedItems.length} Extended</span>
            <span className="text-muted-foreground">— available context</span>
          </span>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const count = items.filter((i) =>
              (tab.sourceTypes as readonly string[]).includes(i.source_type)
            ).length
            const isActive = activeTab === tab.key
            return (
              <a
                key={tab.key}
                href={`?tab=${tab.key}`}
                className={[
                  "whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                ].join(" ")}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {count}
                  </span>
                )}
              </a>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      {tabItems.length === 0 ? (
        (() => {
          const { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } = require("@/components/ui/empty")
          const { Button } = require("@/components/ui/button")
          const { getClientMessage } = require("@/lib/comms/client-messages")
          const Link = require("next/link")
          const { FileText } = require("lucide-react")
          const msg = getClientMessage('careerContext.empty')
          return (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                </EmptyMedia>
                <EmptyTitle>{msg?.subject}</EmptyTitle>
                <EmptyDescription>{msg?.body}</EmptyDescription>
              </EmptyHeader>
              {msg?.actionLabel && msg?.nextAction && (
                <EmptyContent>
                  <Button asChild variant="default">
                    <Link href={msg.nextAction}>{msg.actionLabel}</Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )
        })()
      ) : isExperienceTab && companyGroups ? (
        // Experience tab — company-grouped accordions
        <div className="space-y-6">
          {Object.entries(companyGroups).map(([company, companyItems]) => (
            <div key={company} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">
                {company}
              </h2>
              <div className="space-y-3">
                {companyItems.map((item) => (
                  <CareerContextCard
                    key={item.id}
                    item={item}
                    isCore={isCoreItem(item, evidenceMaps)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // All other tabs — flat card list
        <div className="space-y-3">
          {tabItems.map((item) => (
            <CareerContextCard
              key={item.id}
              item={item}
              isCore={isCoreItem(item, evidenceMaps)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
