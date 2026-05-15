'use client'

import { useState, useTransition } from 'react'
import { saveDocumentEdits, resetDocumentEdits, saveDocumentFormatSettings } from '@/lib/actions/documents'
import { acceptApplicationPackage, markPackageNeedsReview, resetPackageReviewStatus } from '@/lib/actions/package'
import {
  RESUME_FONTS,
  RESUME_FORMATS,
  RESUME_FONT_IDS,
  RESUME_FORMAT_IDS,
  getFormatSafetyWarning,
  type ResumeFontId,
  type ResumeFormatId,
} from '@/lib/resume-formats'
import { ResumePreviewPanel } from '@/components/documents/ResumePreviewPanel'
import { ResumeExportMenu } from '@/components/documents/ResumeExportMenu'

type Job = {
  id: string
  job_url?: string | null
  role_title?: string | null
  company_name?: string | null
  generated_resume: string | null
  generated_cover_letter: string | null
  edited_resume: string | null
  edited_cover_letter: string | null
  resume_format: ResumeFormatId
  resume_font: ResumeFontId
  format_recommendation_reason: string | null
  recommended_resume_format: ResumeFormatId
  recommended_resume_font: ResumeFontId
  recommended_resume_reason: string
  quality_passed?: boolean | null
  package_review_status?: string | null
  generation_timestamp?: string | null
  last_edited_at?: string | null
}

interface DocumentsEditorProps {
  job: Job
  candidateName?: string
}

export default function DocumentsEditor({ job, candidateName = '' }: DocumentsEditorProps) {
  const originalResume = job.generated_resume ?? ''
  const originalCover = job.generated_cover_letter ?? ''

  const [resume, setResume] = useState(job.edited_resume ?? originalResume)
  const [cover, setCover] = useState(job.edited_cover_letter ?? originalCover)
  const [resumeFormat, setResumeFormat] = useState<ResumeFormatId>(job.resume_format)
  const [resumeFont, setResumeFont] = useState<ResumeFontId>(job.resume_font)
  const [status, setStatus] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState(job.quality_passed === true)
  const [packageStatus, setPackageStatus] = useState(job.package_review_status ?? 'needs_review')
  const [showPreview, setShowPreview] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formatWarning = getFormatSafetyWarning(resumeFormat, job.job_url)

  // Saved database state — preview always shows this, not the textarea value
  const savedResumeContent = job.edited_resume ?? originalResume
  // True when the textarea has changes the user hasn't saved yet
  const resumeHasUnsavedChanges = resume !== savedResumeContent

  const flash = (msg: string, ms = 2500) => {
    setStatus(msg)
    setTimeout(() => setStatus(null), ms)
  }

  const isDirty =
    resume !== (job.edited_resume ?? originalResume) ||
    cover !== (job.edited_cover_letter ?? originalCover) ||
    resumeFormat !== job.resume_format ||
    resumeFont !== job.resume_font

  const handleSave = () => {
    startTransition(async () => {
      const recommendationReason =
        resumeFormat === job.recommended_resume_format
          ? job.recommended_resume_reason
          : job.format_recommendation_reason ?? job.recommended_resume_reason

      const [result, formatResult] = await Promise.all([
        saveDocumentEdits(
          job.id,
          resume === originalResume ? null : resume,
          cover === originalCover ? null : cover
        ),
        saveDocumentFormatSettings(job.id, resumeFormat, resumeFont, recommendationReason),
      ])

      if (result.error || formatResult.error) {
        flash(`Error: ${result.error ?? formatResult.error}`)
      } else {
        flash('Saved')
        if (isAccepted) {
          setIsAccepted(false)
          setPackageStatus('needs_review')
          await resetPackageReviewStatus(job.id).catch(() => {})
        }
      }
    })
  }

  const handleReset = () => {
    if (!confirm('Reset to the original generated version? Your edits will be lost.')) return
    startTransition(async () => {
      const result = await resetDocumentEdits(job.id)
      if (result.success) {
        setResume(originalResume)
        setCover(originalCover)
        setIsAccepted(false)
        setPackageStatus('needs_review')
        await resetPackageReviewStatus(job.id).catch(() => {})
        flash('Reset to original')
      } else {
        flash(`Error: ${result.error}`)
      }
    })
  }

  const handleAccept = () => {
    startTransition(async () => {
      if (isDirty) {
        const saveResult = await saveDocumentEdits(
          job.id,
          resume === originalResume ? null : resume,
          cover === originalCover ? null : cover
        )
        if (saveResult.error) {
          flash(`Save failed: ${saveResult.error}`)
          return
        }
      }
      const result = await acceptApplicationPackage(job.id)
      if (result.success) {
        setIsAccepted(true)
        setPackageStatus('ready')
        flash('Package accepted — Apply button now unlocked')
      } else {
        flash(`Error: ${result.error}`)
      }
    })
  }

  const handleFlagReview = () => {
    startTransition(async () => {
      const result = await markPackageNeedsReview(job.id, 'Manually flagged by user for review')
      if (result.success) {
        setIsAccepted(false)
        setPackageStatus('needs_review')
        flash('Flagged for review')
      } else {
        flash(`Error: ${result.error}`)
      }
    })
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      flash(`${label} copied`)
    } catch {
      flash('Copy failed — check browser permissions')
    }
  }

  return (
    <>
    <ResumePreviewPanel
      open={showPreview}
      onOpenChange={setShowPreview}
      savedResumeContent={savedResumeContent}
      generatedResumeContent={job.generated_resume}
      editedResumeContent={job.edited_resume}
      resumeFormat={resumeFormat}
      resumeFont={resumeFont}
      jobId={job.id}
      jobTitle={job.role_title ?? ''}
      company={job.company_name ?? ''}
      candidateName={candidateName}
      generatedAt={job.generation_timestamp ?? null}
      editedAt={job.last_edited_at ?? null}
      hasUnsavedChanges={resumeHasUnsavedChanges}
      onEdit={() => setShowPreview(false)}
      onMessage={flash}
    />
    <div className="space-y-6">
      <PackageGate
        isAccepted={isAccepted}
        packageStatus={packageStatus}
        isPending={isPending}
        onAccept={handleAccept}
        onFlagReview={handleFlagReview}
      />

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold">Resume Format</p>
          <p className="text-xs text-muted-foreground mt-1">
            Recommended: {RESUME_FORMATS[job.recommended_resume_format].label} + {RESUME_FONTS[job.recommended_resume_font].label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{job.recommended_resume_reason}</p>
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          {RESUME_FORMAT_IDS.map(formatId => {
            const format = RESUME_FORMATS[formatId]
            const selected = resumeFormat === formatId
            return (
              <button
                key={formatId}
                type="button"
                onClick={() => { setResumeFormat(formatId); setResumeFont(format.defaultFont) }}
                className={[
                  'rounded-md border p-3 text-left transition-colors',
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
                ].join(' ')}
              >
                <span className="block text-xs font-semibold text-foreground">{format.label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{format.description}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">Font</p>
          <div className="flex flex-wrap gap-2">
            {RESUME_FONT_IDS.map(fontId => {
              const selected = resumeFont === fontId
              const recommended = fontId === RESUME_FORMATS[resumeFormat].defaultFont
              return (
                <button
                  key={fontId}
                  type="button"
                  onClick={() => setResumeFont(fontId)}
                  className={[
                    'rounded-md border px-3 py-2 text-sm transition-colors',
                    selected ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/40',
                  ].join(' ')}
                >
                  {RESUME_FONTS[fontId].label}{recommended ? ' ★' : ''}
                </button>
              )
            })}
          </div>
        </div>

        {formatWarning && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {formatWarning}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Resume</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(resume, 'Resume')}
              className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
            >
              Copy
            </button>
            {!!originalResume && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded border border-border bg-background px-3 py-1 text-xs transition-colors hover:bg-muted"
              >
                Preview
              </button>
            )}
            <ResumeExportMenu
              jobId={job.id}
              resumeContent={resume}
              resumeFormat={resumeFormat}
              resumeFont={resumeFont}
              jobTitle={job.role_title ?? ''}
              company={job.company_name ?? ''}
              candidateName={candidateName}
              documentType="resume"
              onMessage={flash}
            />
          </div>
        </div>
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value)}
          className="h-112 w-full rounded border border-border bg-background p-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          spellCheck
        />
      </section>

      <Section
        title="Cover Letter"
        onCopy={() => handleCopy(cover, 'Cover letter')}
        onExport={async () => {
          try {
            const res = await fetch('/api/export-docx', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: cover, filename: 'cover-letter', resumeFormat, resumeFont, job_id: job.id }),
            })
            if (!res.ok) { flash('Export failed'); return }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'cover-letter.docx'
            document.body.appendChild(a); a.click(); a.remove()
            URL.revokeObjectURL(url)
            flash('Downloaded')
          } catch { flash('Export failed') }
        }}
      >
        <textarea
          value={cover}
          onChange={e => setCover(e.target.value)}
          className="h-72 w-full rounded border border-border bg-background p-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          spellCheck
        />
      </Section>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <button
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          {isPending ? 'Saving…' : isDirty ? 'Save edits' : 'Saved'}
        </button>
        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Reset to original
        </button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>
    </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Package Gate Banner
// ---------------------------------------------------------------------------

interface PackageGateProps {
  isAccepted: boolean
  packageStatus: string
  isPending: boolean
  onAccept: () => void
  onFlagReview: () => void
}

function PackageGate({ isAccepted, packageStatus, isPending, onAccept, onFlagReview }: PackageGateProps) {
  if (isAccepted && packageStatus === 'ready') {
    return (
      <div className="flex items-center justify-between rounded border border-border bg-background px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Package accepted</p>
            <p className="text-xs text-muted-foreground">Apply button is now unlocked. Edit documents to re-review.</p>
          </div>
        </div>
        <button
          onClick={onFlagReview}
          disabled={isPending}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-40"
        >
          Flag for review
        </button>
      </div>
    )
  }

  if (packageStatus === 'needs_review') {
    return (
      <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Review before applying</p>
            <p className="text-xs text-muted-foreground">Read through both documents, then accept to unlock the Apply button.</p>
          </div>
        </div>
        <button
          onClick={onAccept}
          disabled={isPending}
          className="rounded bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
        >
          {isPending ? 'Accepting…' : 'Accept package'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded border border-border bg-background px-5 py-4">
      <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">
        Status: <code className="rounded bg-muted px-1 text-xs">{packageStatus}</code>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  onCopy,
  onExport,
}: {
  title: string
  children: React.ReactNode
  onCopy: () => void
  onExport: () => void
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onCopy} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">
            Copy
          </button>
          <button onClick={onExport} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">
            Download .docx
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}
