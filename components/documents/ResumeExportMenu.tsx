'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon, DownloadIcon, FileTextIcon, PrinterIcon } from 'lucide-react'
import { validateResumeStructure } from '@/lib/resume/validate-structure'
import { generateDocumentFilename } from '@/lib/filename-utils'
import { emitExportEvent } from '@/lib/actions/resume-export'
import { cn } from '@/lib/utils'

interface ResumeExportMenuProps {
  jobId: string
  resumeContent: string
  resumeFormat: string
  resumeFont: string
  jobTitle: string
  company: string
  candidateName: string
  documentType?: 'resume' | 'cover_letter'
  onMessage?: (msg: string) => void
  size?: 'sm' | 'default'
}

export function ResumeExportMenu({
  jobId,
  resumeContent,
  resumeFormat,
  resumeFont,
  jobTitle,
  company,
  candidateName,
  documentType = 'resume',
  onMessage,
  size = 'sm',
}: ResumeExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const flash = (msg: string) => onMessage?.(msg)

  const baseFilename = generateDocumentFilename({
    candidateName: candidateName || 'Candidate',
    role: jobTitle,
    company,
    documentType,
    extension: 'docx',
  }).replace(/\.docx$/, '')

  const handleDocx = async () => {
    const validation = validateResumeStructure(resumeContent)
    if (!validation.valid) {
      flash(`Export blocked: ${validation.errors[0]}`)
      return
    }

    setIsExporting(true)
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: resumeContent,
          filename: baseFilename,
          resumeFormat,
          resumeFont,
          job_id: jobId,
        }),
      })

      if (!res.ok) {
        flash('DOCX export failed — try again')
        return
      }

      const blob = await res.blob()
      triggerDownload(blob, `${baseFilename}.docx`)
      flash('DOCX downloaded')
    } catch {
      flash('DOCX export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleTxt = () => {
    const blob = new Blob([resumeContent], { type: 'text/plain;charset=utf-8' })
    triggerDownload(blob, `${baseFilename}.txt`)
    flash('Text file downloaded')
    void emitExportEvent(jobId, 'txt')
  }

  const handlePrint = () => {
    void emitExportEvent(jobId, 'print')
    openPrintWindow(resumeContent, resumeFont)
  }

  const triggerClass = cn(
    'flex items-center gap-1 rounded border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-40',
    size === 'default' && 'px-4 py-2'
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" disabled={isExporting} className={triggerClass}>
          {isExporting ? 'Exporting…' : 'Export'}
          <ChevronDownIcon className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleDocx} disabled={isExporting}>
          <DownloadIcon className="mr-2 h-3.5 w-3.5" />
          Download DOCX (ATS Clean)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTxt}>
          <FileTextIcon className="mr-2 h-3.5 w-3.5" />
          Download Plain Text
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint}>
          <PrinterIcon className="mr-2 h-3.5 w-3.5" />
          <span>
            Print / Save as PDF
            <span className="ml-1 text-[10px] text-muted-foreground">(browser PDF)</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Opens an isolated print window — zero app chrome, zero watermark.
// The ATS safety guarantee: only raw text reaches the print renderer.
function openPrintWindow(content: string, fontHint: string) {
  const win = window.open('', '_blank', 'width=850,height=1100')
  if (!win) return

  const fontFamily = resolvePrintFont(fontHint)
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <style>
    @page { margin: 0.75in; }
    body {
      font-family: ${fontFamily};
      font-size: 11pt;
      line-height: 1.45;
      margin: 0;
      color: #000;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: inherit;
      margin: 0;
    }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`)
  win.document.close()
}

function resolvePrintFont(fontId: string): string {
  const map: Record<string, string> = {
    inter: "'Inter', -apple-system, sans-serif",
    calibri: "'Calibri', 'Carlito', sans-serif",
    arial: "'Arial', sans-serif",
    helvetica: "'Helvetica Neue', 'Helvetica', sans-serif",
    georgia: "'Georgia', serif",
  }
  return map[fontId] ?? "'Arial', sans-serif"
}
