'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { saveDocumentEdits, resetDocumentEdits } from '@/lib/actions/documents'
import { createClient } from '@/lib/supabase/client'
import GovernancePanel from './GovernancePanel'
import VerificationBadge from './VerificationBadge'
import type { Verdict } from './VerificationBadge'
import { ShieldCheck } from 'lucide-react'

type Job = {
  id: string
  generated_resume: string | null
  generated_cover_letter: string | null
  edited_resume: string | null
  edited_cover_letter: string | null
}

type Claim = {
  id: string
  claim_text: string
  section: string
  position: number
  evidence_ids: string[]
  claim_grounded: boolean
  governance_verdict: string | null
  provenance_ref: Record<string, unknown> | null
}

export default function DocumentsEditor({ job }: { job: Job }) {
  const originalResume = job.generated_resume ?? ''
  const originalCover = job.generated_cover_letter ?? ''

  const [resume, setResume] = useState(job.edited_resume ?? originalResume)
  const [cover, setCover] = useState(job.edited_cover_letter ?? originalCover)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Governance state
  const [claims, setClaims] = useState<Claim[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [showProvenance, setShowProvenance] = useState(false)

  // Fetch claims on mount — cancellable to prevent stale-result race on job.id change
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const fetchClaims = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('generated_claims')
        .select('*')
        .eq('job_id', job.id)
        .eq('user_id', user.id)
        .order('position', { ascending: true })
      if (data && !cancelled) setClaims(data)
    }
    fetchClaims()
    return () => { cancelled = true }
  }, [job.id])

  // Find the claim matching a bullet line (fuzzy match on first 50 chars)
  const findClaim = useCallback((line: string): Claim | null => {
    const clean = line.replace(/^[•\-\*]\s*/, '').trim()
    if (!clean) return null
    return claims.find(c =>
      c.claim_text.slice(0, 50) === clean.slice(0, 50) ||
      c.claim_text.toLowerCase().slice(0, 50) === clean.toLowerCase().slice(0, 50)
    ) ?? null
  }, [claims])

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
      flash(result.error ? `Error: ${result.error}` : 'Saved')
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
        body: JSON.stringify({ text, filename }),
      })
      if (!res.ok) { flash('Export failed'); return }
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

  // Parse resume into bullet lines for provenance view
  const resumeLines = resume.split('\n')
  const bulletLines = resumeLines.filter(l => /^[•\-\*]\s/.test(l.trim()) || l.trim().startsWith('•'))

  return (
    <div className="space-y-8">
      {/* GovernancePanel — mounted at root, controlled by selectedClaimId */}
      <GovernancePanel
        jobId={job.id}
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
      />

      {/* Resume Section */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Resume</h2>
          <div className="flex gap-2">
            {claims.length > 0 && (
              <button
                onClick={() => setShowProvenance(p => !p)}
                className={`inline-flex items-center gap-1.5 rounded border px-3 py-1 text-sm transition-colors ${
                  showProvenance
                    ? 'bg-black text-white border-black'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {showProvenance ? 'Edit Mode' : 'Provenance'}
              </button>
            )}
            <button
              onClick={() => handleCopy(resume, 'Resume')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Copy
            </button>
            <button
              onClick={() => handleExportDocx(resume, 'resume')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Download .docx
            </button>
          </div>
        </div>

        {showProvenance ? (
          <div className="rounded border bg-gray-50 p-4 font-mono text-sm space-y-1 min-h-[28rem] overflow-y-auto">
            {resumeLines.map((line, i) => {
              const claim = findClaim(line)
              const verdict = (claim?.governance_verdict as Verdict) ?? null
              const isBullet = /^[•\-\*]\s/.test(line.trim()) || line.trim().startsWith('•')
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 py-0.5 ${
                    isBullet && claim ? 'group cursor-pointer rounded px-1 hover:bg-white' : ''
                  }`}
                  onClick={() => {
                    if (isBullet && claim) setSelectedClaimId(claim.id)
                  }}
                >
                  <span className="flex-1 whitespace-pre-wrap text-gray-800">{line || ' '}</span>
                  {isBullet && (
                    <span className="shrink-0 mt-0.5">
                      <VerificationBadge
                        verdict={verdict}
                        evidenceCount={claim ? (Array.isArray(claim.evidence_ids) ? claim.evidence_ids.length : 0) : undefined}
                        onClick={claim ? () => setSelectedClaimId(claim.id) : undefined}
                        compact
                      />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            className="h-[28rem] w-full rounded border p-3 font-mono text-sm"
            spellCheck
          />
        )}
      </section>

      {/* Cover Letter Section */}
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
