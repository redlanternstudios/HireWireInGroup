import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getProfileLinks } from '@/lib/actions/profile-links'
import { ProfileLinksWidget } from '@/components/profile-links-widget'
import { LinkedInImportWidget } from '@/components/dashboard/LinkedInImportWidget'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check onboarding status — onboarding_complete lives on user_profile
  const { data: profile } = await supabase
      {jobList.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-medium">Your jobs</h2>
            <a href="/jobs" className="text-sm text-primary hover:underline">
              Add job 
            </a>
          </div>
          <ul className="divide-y divide-border">
            {jobList.map(job => {
              const hasDocs = !!job.generated_resume
              const statusLabel = STATUS_LABELS[job.status] ?? job.status
              const statusColor = STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'
              return (
                <li key={job.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{job.role_title ?? 'Untitled role'}</p>
                    <p className="text-sm text-muted-foreground truncate">{job.company_name ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                    {hasDocs && (
                      <Link
                        href={`/jobs/${job.id}/documents`}
                        className="inline-flex items-center rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800 transition-colors"
                      >
                        View documents
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        (() => {
          const { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } = require("@/components/ui/empty")
          const { Button } = require("@/components/ui/button")
          const { getClientMessage } = require("@/lib/comms/client-messages")
          const Link = require("next/link")
          const { Briefcase } = require("lucide-react")
          const msg = getClientMessage('jobs.empty')
          return (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Briefcase className="h-10 w-10 text-muted-foreground/40" />
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
      )}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total jobs tracked</p>
          <p className="text-3xl font-semibold mt-1">{jobList.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Documents generated</p>
          <p className="text-3xl font-semibold mt-1">{generatedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Applications sent</p>
          <p className="text-3xl font-semibold mt-1">{appliedCount}</p>
        </div>
      </div>

      <ProfileLinksWidget initialLinks={profileLinks} />

      <LinkedInImportWidget />

      {jobList.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-medium">Your jobs</h2>
            <a href="/jobs" className="text-sm text-primary hover:underline">
              Add job →
            </a>
          </div>
          <ul className="divide-y divide-border">
            {jobList.map(job => {
              const hasDocs = !!job.generated_resume
              const statusLabel = STATUS_LABELS[job.status] ?? job.status
              const statusColor = STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'

              return (
                <li key={job.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {job.role_title ?? 'Untitled role'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {job.company_name ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                    {hasDocs && (
                      <Link
                        href={`/jobs/${job.id}/documents`}
                        className="inline-flex items-center rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800 transition-colors"
                      >
                        View documents
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-medium mb-4">Get started</h2>
          <div className="space-y-3">
            <a
              href="/jobs"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">Browse &amp; add jobs</p>
                <p className="text-sm text-muted-foreground">Paste a job URL to analyze fit and generate documents</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
            <a
              href="/profile"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">Complete your profile</p>
                <p className="text-sm text-muted-foreground">Add work history and evidence to power document generation</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
