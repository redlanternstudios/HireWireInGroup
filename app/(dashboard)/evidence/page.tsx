import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EvidenceList from './EvidenceList'
import { CareerContextOverview } from './CareerContextOverview'
import type { EvidenceRecord } from '@/lib/types'
import type { SourceResume } from './EvidenceList'

export const dynamic = 'force-dynamic'

function extractStartYear(dateRange: string | null | undefined): number | null {
  if (!dateRange) return null
  const match = dateRange.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

function computeOverviewMetrics(items: EvidenceRecord[]) {
  const workItems  = items.filter(i => i.source_type === 'work_experience')
  const certItems  = items.filter(i => i.source_type === 'certification')
  const eduItems   = items.filter(i => i.source_type === 'education')
  const skillItems = items.filter(i => i.source_type === 'skill')

  // Years of experience from earliest work start year
  const startYears = workItems
    .map(i => extractStartYear(i.date_range))
    .filter((y): y is number => y !== null)
  const earliestYear = startYears.length > 0 ? Math.min(...startYears) : null
  const yearsExperience = earliestYear ? new Date().getFullYear() - earliestYear : null

  // Top skills — aggregate tools_used across all items, rank by frequency
  const skillFreq: Record<string, number> = {}
  for (const item of items) {
    for (const s of (Array.isArray(item.tools_used) ? item.tools_used : [])) {
      skillFreq[s] = (skillFreq[s] ?? 0) + 1
    }
  }
  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([s]) => s)

  // Top industries — aggregate industries arrays, rank by frequency
  const industryFreq: Record<string, number> = {}
  for (const item of items) {
    for (const ind of (Array.isArray(item.industries) ? item.industries : [])) {
      industryFreq[ind] = (industryFreq[ind] ?? 0) + 1
    }
  }
  const topIndustries = Object.entries(industryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([i]) => i)

  // Profile Strength — from CLAUDE.md spec
  const workWithOutcomes = workItems.filter(i => Array.isArray(i.outcomes) && i.outcomes.length > 0).length
  const workOutcomeRate  = workItems.length > 0 ? workWithOutcomes / workItems.length : 0
  const totalSkillCount  = skillItems.reduce(
    (sum, i) => sum + (Array.isArray(i.tools_used) ? i.tools_used.length : 0), 0
  ) + topSkills.length
  const approvedCount = items.filter(i => i.is_user_approved).length
  const approvalRate  = items.length > 0 ? approvedCount / items.length : 0

  const profileStrength = Math.round(
    workOutcomeRate * 30 +
    (totalSkillCount > 5 ? 1 : totalSkillCount / 5) * 20 +
    (certItems.length > 0 ? 1 : 0) * 15 +
    (eduItems.length  > 0 ? 1 : 0) * 15 +
    approvalRate * 20
  )

  // ATS Readiness — from approved_keywords counts
  const totalKeywords = items.reduce(
    (sum, i) => sum + (Array.isArray(i.approved_keywords) ? i.approved_keywords.length : 0), 0
  )
  const atsReadiness: 'Strong' | 'Medium' | 'Weak' =
    totalKeywords >= 20 ? 'Strong' : totalKeywords >= 8 ? 'Medium' : 'Weak'

  return {
    totalItems: items.length,
    yearsExperience,
    topSkills,
    topIndustries,
    profileStrength,
    atsReadiness,
    workCount: workItems.length,
    certCount: certItems.length,
    eduCount:  eduItems.length,
  }
}

export default async function EvidencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel fetches — evidence items, job provenance, uploaded resumes
  const [{ data: items }, { data: jobs }, { data: resumes }] = await Promise.all([
    supabase
      .from('evidence_library')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority_rank', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('resume_provenance')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .not('resume_provenance', 'is', null),
    supabase
      .from('source_resumes')
      .select('id, file_name, file_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Build Core ID set from jobs.resume_provenance[].source_evidence_id
  const coreIds = new Set<string>()
  for (const job of (jobs ?? [])) {
    const provenance = Array.isArray(job.resume_provenance) ? job.resume_provenance : []
    for (const entry of provenance) {
      const id = (entry as Record<string, unknown>)?.source_evidence_id
      if (typeof id === 'string') coreIds.add(id)
    }
  }

  const evidenceItems = (items ?? []) as EvidenceRecord[]
  const overview = computeOverviewMetrics(evidenceItems)
  const coreCount = evidenceItems.filter(
    i => (i.confidence_level === 'high' && coreIds.has(i.id)) || i.is_user_approved
  ).length

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Career Context</h1>
        <p className="text-sm text-muted-foreground mt-1">
          What the AI knows about you — your experience, skills, and proof points that power every generation.
        </p>
      </div>

      <CareerContextOverview {...overview} coreCount={coreCount} />

      <EvidenceList
        initialItems={evidenceItems}
        coreIds={Array.from(coreIds)}
        sourceResumes={(resumes ?? []) as SourceResume[]}
      />
    </div>
  )
}
