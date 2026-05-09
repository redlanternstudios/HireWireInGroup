import { cn } from '@/lib/utils'

interface CareerContextOverviewProps {
  totalItems: number
  yearsExperience: number | null
  topSkills: string[]
  topIndustries: string[]
  profileStrength: number
  atsReadiness: 'Strong' | 'Medium' | 'Weak'
  workCount: number
  certCount: number
  eduCount: number
  coreCount: number
}

const ATS_COLORS = {
  Strong: 'text-green-700 bg-green-50',
  Medium: 'text-yellow-700 bg-yellow-50',
  Weak: 'text-red-700 bg-red-50',
}

const STRENGTH_COLOR = (pct: number) =>
  pct >= 75 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-400' : 'bg-red-400'

export function CareerContextOverview({
  totalItems,
  yearsExperience,
  topSkills,
  topIndustries,
  profileStrength,
  atsReadiness,
  workCount,
  certCount,
  eduCount,
  coreCount,
}: CareerContextOverviewProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Career Snapshot</h2>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ATS_COLORS[atsReadiness])}>
          ATS Readiness: {atsReadiness}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Left — stats */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total items" value={totalItems.toString()} />
            <Stat label="Years experience" value={yearsExperience ? `${yearsExperience}+` : '—'} />
            <Stat label="Roles tracked" value={workCount.toString()} />
            <Stat label="Certifications" value={certCount.toString()} />
            <Stat label="Education entries" value={eduCount.toString()} />
            <Stat label="Core items" value={coreCount.toString()} highlight />
          </div>

          {/* Profile strength bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Profile Strength</span>
              <span className="text-xs font-semibold tabular-nums">{profileStrength}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', STRENGTH_COLOR(profileStrength))}
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {profileStrength >= 75
                ? 'Strong profile — high generation confidence'
                : profileStrength >= 45
                ? 'Good foundation — add outcomes to boost further'
                : 'Add work experience outcomes and approve key items to improve'}
            </p>
          </div>
        </div>

        {/* Right — skills + industries */}
        <div className="space-y-4">
          {topSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Top Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topIndustries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Top Industries</p>
              <div className="flex flex-wrap gap-1.5">
                {topIndustries.map(industry => (
                  <span
                    key={industry}
                    className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topSkills.length === 0 && topIndustries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Upload a resume or add experience items to see your skill and industry snapshot.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums mt-0.5', highlight && 'text-primary')}>
        {value}
      </p>
    </div>
  )
}
