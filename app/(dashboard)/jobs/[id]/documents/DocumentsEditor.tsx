'use client'

import { useState, useTransition } from 'react'
import {
  saveDocumentEdits,
  resetDocumentEdits,
  saveDocumentFormatSettings,
} from '@/lib/actions/documents'
import {
  RESUME_FONTS,
  RESUME_FORMATS,
  RESUME_FONT_IDS,
  RESUME_FORMAT_IDS,
  getFormatSafetyWarning,
  type ResumeFontId,
  type ResumeFormatId,
} from '@/lib/resume-formats'

type Job = {
  id: string
  job_url?: string | null
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
}

export default function DocumentsEditor({ job }: { job: Job }) {
  const originalResume = job.generated_resume ?? ''
  const originalCover = job.generated_cover_letter ?? ''

  const [resume, setResume] = useState(job.edited_resume ?? originalResume)
  const [cover, setCover] = useState(job.edited_cover_letter ?? originalCover)
  const [resumeFormat, setResumeFormat] = useState<ResumeFormatId>(job.resume_format)
  const [resumeFont, setResumeFont] = useState<ResumeFontId>(job.resume_font)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formatWarning = getFormatSafetyWarning(resumeFormat, job.job_url)

  const flash = (msg: string, ms = 2500) => {
    setStatus(msg)
    setTimeout(() => setStatus(null), ms)
  }

  const handleSave = () => {
    startTransition(async () => {
      const recommendationReason =
        resumeFormat === job.recommended_resume_format
          ? job.recommended_resume_reason
          : job.format_recommendation_reason ?? job.recommended_resume_reason

      const result = await saveDocumentEdits(
        job.id,
        resume === originalResume ? null : resume,
        cover === originalCover ? null : cover
      )
      const formatResult = await saveDocumentFormatSettings(
        job.id,
        resumeFormat,
        resumeFont,
        recommendationReason
      )
      flash(result.error || formatResult.error ? `Error: ${result.error ?? formatResult.error}` : 'Saved')
    })
  }

  const handleReset = () => {
    if (!confirm('Reset to the original generated version? Your edits will be lost.'))
      return
    startTransition(async () => {
      const result = await resetDocumentEdits(job.id)
      if (result.success) {
        setResume(originalResume)
        setCover(originalCover)
        flash('Reset to original')
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
        body: JSON.stringify({ text, filename, resumeFormat, resumeFont, job_id: job.id }),
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

  const isDirty = resume !== (job.edited_resume ?? originalResume)
    || cover !== (job.edited_cover_letter ?? originalCover)
    || resumeFormat !== job.resume_format
    || resumeFont !== job.resume_font

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold">Resume Format</p>
          <p className="text-xs text-muted-foreground mt-1">
            Recommended for this job: {RESUME_FORMATS[job.recommended_resume_format].label} + {RESUME_FONTS[job.recommended_resume_font].label}
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
                onClick={() => {
                  setResumeFormat(formatId)
                  setResumeFont(format.defaultFont)
                }}
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
                  {RESUME_FONTS[fontId].label}{recommended ? ' Recommended' : ''}
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

      <Section
        title="Resume"
        onCopy={() => handleCopy(resume, 'Resume')}
        onExport={() => handleExportDocx(resume, 'resume')}
      >
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value)}
          className="h-112 w-full rounded border p-3 font-mono text-sm"
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
          className="h-72 w-full rounded border p-3 font-mono text-sm"
          spellCheck
        />
      </Section>

      <div className="flex items-center gap-3 border-t pt-4">
        <button
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isDirty ? 'Save edits' : 'Saved'}
        </button>
        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Reset to original
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  )
}

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
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Copy
          </button>
          <button
            onClick={onExport}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Download .docx
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}
