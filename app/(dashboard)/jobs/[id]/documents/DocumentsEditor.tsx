'use client'

import { useState, useTransition } from 'react'
import { saveDocumentEdits, resetDocumentEdits } from '@/lib/actions/documents'
import {
  acceptApplicationPackage,
  markPackageNeedsReview,
  resetPackageReviewStatus,
} from '@/lib/actions/package'

type Job = {
  id: string
  generated_resume: string | null
  generated_cover_letter: string | null
  edited_resume: string | null
  edited_cover_letter: string | null
}

interface DocumentsEditorProps {
  job: Job
  qualityPassed: boolean
  generationStatus: string
}

export default function DocumentsEditor({
  job,
  qualityPassed,
  generationStatus,
}: DocumentsEditorProps) {
  const originalResume = job.generated_resume ?? ''
  const originalCover = job.generated_cover_letter ?? ''

  const [resume, setResume] = useState(job.edited_resume ?? originalResume)
  const [cover, setCover] = useState(job.edited_cover_letter ?? originalCover)
  const [status, setStatus] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState(qualityPassed)
  const [packageStatus, setPackageStatus] = useState(generationStatus)
  const [isPending, startTransition] = useTransition()

  const flash = (msg: string, ms = 2500) => {
    setStatus(msg)
    setTimeout(() => setStatus(null), ms)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveDocumentEdits(
        job.id,
        resume === originalResume ? null : resume,
        cover === originalCover ? null : cover
      )
      if (result.error) {
        flash(`Error: ${result.error}`)
      } else {
        flash('Saved')
        // Editing after acceptance resets package status — require re-review
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
      // Save any pending edits first
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
      const result = await markPackageNeedsReview(
        job.id,
        'Manually flagged by user for review'
      )
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

  const handleExportDocx = async (text: string, filename: string) => {
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filename }),
      })
      if (!res.ok) {
        flash('Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      flash('Downloaded')
    } catch {
      flash('Export failed')
    }
  }

  const isDirty =
    resume !== (job.edited_resume ?? originalResume) ||
    cover !== (job.edited_cover_letter ?? originalCover)

  return (
    <div className="space-y-6">
      {/* Package acceptance gate */}
      <PackageGate
        isAccepted={isAccepted}
        packageStatus={packageStatus}
        isPending={isPending}
        onAccept={handleAccept}
        onFlagReview={handleFlagReview}
      />

      <Section
        title="Resume"
        onCopy={() => handleCopy(resume, 'Resume')}
        onExport={() => handleExportDocx(resume, 'resume')}
      >
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value)}
          className="h-[28rem] w-full rounded border border-border bg-background p-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          spellCheck
        />
      </Section>

      <Section
        title="Cover Letter"
        onCopy={() => handleCopy(cover, 'Cover letter')}
        onExport={() => handleExportDocx(cover, 'cover-letter')}
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
          {isPending ? 'Saving...' : isDirty ? 'Save edits' : 'Saved'}
        </button>
        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Reset to original
        </button>
        {status && (
          <span className="text-sm text-muted-foreground">{status}</span>
        )}
      </div>
    </div>
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

function PackageGate({
  isAccepted,
  packageStatus,
  isPending,
  onAccept,
  onFlagReview,
}: PackageGateProps) {
  if (isAccepted && packageStatus === 'ready') {
    return (
      <div className="flex items-center justify-between rounded border border-border bg-background px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Package accepted</p>
            <p className="text-xs text-muted-foreground">
              Apply button is now unlocked. Edit documents to re-review.
            </p>
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
            <p className="text-xs text-muted-foreground">
              Read through both documents, then accept to unlock the Apply button.
            </p>
          </div>
        </div>
        <button
          onClick={onAccept}
          disabled={isPending}
          className="rounded bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
        >
          {isPending ? 'Accepting...' : 'Accept package'}
        </button>
      </div>
    )
  }

  // Fallback for any other status (generating, failed, etc.)
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
          <button
            onClick={onCopy}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            Copy
          </button>
          <button
            onClick={onExport}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            Download .docx
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}
