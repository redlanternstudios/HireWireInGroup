'use client'

import { useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { ResumeExportMenu } from './ResumeExportMenu'
import { emitPreviewOpenedEvent } from '@/lib/actions/resume-export'
import { buildResumeRenderModel } from '@/lib/resume/render-model'
import type { ResumeSourceAttribution } from '@/lib/resume/render-model'
import { cn } from '@/lib/utils'

interface ResumePreviewPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Saved database state — preview always shows last saved version
  savedResumeContent: string
  generatedResumeContent: string | null
  editedResumeContent: string | null

  resumeFormat: string
  resumeFont: string
  jobId: string
  jobTitle: string
  company: string
  candidateName: string
  generatedAt: string | null
  editedAt: string | null

  // Whether the textarea has changes not yet saved to the database
  hasUnsavedChanges: boolean

  onEdit: () => void
  onMessage?: (msg: string) => void
}

export function ResumePreviewPanel({
  open,
  onOpenChange,
  savedResumeContent,
  generatedResumeContent,
  editedResumeContent,
  resumeFormat,
  resumeFont,
  jobId,
  jobTitle,
  company,
  candidateName,
  generatedAt,
  editedAt,
  hasUnsavedChanges,
  onEdit,
  onMessage,
}: ResumePreviewPanelProps) {
  const renderModel = buildResumeRenderModel(savedResumeContent, {
    generatedResume: generatedResumeContent,
    editedResume: editedResumeContent,
    resumeFormat,
    resumeFont,
    jobId,
    jobTitle,
    company,
    generatedAt,
    editedAt,
  })

  // Emit preview opened event once when panel opens
  useEffect(() => {
    if (open && jobId) {
      void emitPreviewOpenedEvent(jobId)
    }
  }, [open, jobId])

  const fontFamily = resolveFontFamily(resumeFont)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-2xl w-full"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">
                {jobTitle}
                {company ? (
                  <span className="font-normal text-muted-foreground"> @ {company}</span>
                ) : null}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="mt-1 flex items-center gap-2">
                  <SourceBadge attribution={renderModel.sourceAttribution} />
                  {editedAt && (
                    <span className="text-xs text-muted-foreground">
                      Edited {new Date(editedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Unsaved changes warning */}
        {hasUnsavedChanges && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Preview shows your last saved version. Export from the editor uses your current unsaved text.
              Save your changes first if you want preview and export to match.
            </p>
          </div>
        )}

        {/* Resume content — scrollable */}
        <div className="relative flex-1 overflow-y-auto bg-white dark:bg-neutral-950">
          {/* Watermark — visual only, hidden on print via globals.css */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden
            className="hw-watermark pointer-events-none fixed bottom-6 right-6 z-0 w-28 select-none opacity-[0.07]"
          />

          {/* Document content */}
          <div
            className="relative z-10 mx-auto max-w-[680px] px-10 py-10"
            style={{ fontFamily }}
          >
            <pre
              className="whitespace-pre-wrap break-words text-[11pt] leading-[1.45] text-neutral-900 dark:text-neutral-100"
              style={{ fontFamily }}
            >
              {savedResumeContent}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <SheetFooter className="shrink-0 border-t border-border bg-background px-5 py-3">
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { onOpenChange(false); onEdit() }}
              className="rounded border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Edit resume
            </button>
            <ResumeExportMenu
              jobId={jobId}
              resumeContent={savedResumeContent}
              resumeFormat={resumeFormat}
              resumeFont={resumeFont}
              jobTitle={jobTitle}
              company={company}
              candidateName={candidateName}
              documentType="resume"
              onMessage={onMessage}
            />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Source Attribution Badge ─────────────────────────────────────────────────

function SourceBadge({ attribution }: { attribution: ResumeSourceAttribution }) {
  const config = {
    generated: { label: 'Generated by HireWire AI', class: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    edited: { label: 'Edited by you', class: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
    hybrid: { label: 'Hybrid version', class: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
  }
  const { label, class: cls } = config[attribution]
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', cls)}>
      {label}
    </span>
  )
}

// ─── Font Resolution ──────────────────────────────────────────────────────────

function resolveFontFamily(fontId: string): string {
  const map: Record<string, string> = {
    inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    calibri: "'Calibri', 'Carlito', 'Arial', sans-serif",
    arial: "'Arial', sans-serif",
    helvetica: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    georgia: "'Georgia', 'Times New Roman', serif",
  }
  return map[fontId] ?? "'Arial', sans-serif"
}
