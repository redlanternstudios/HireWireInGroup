'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ShieldCheck, AlertTriangle, XCircle, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Verdict } from './VerificationBadge'

interface EvidenceItem {
  id: string
  title: string
  content_snippet: string | null
  evidence_type: string
}

interface Claim {
  id: string
  claim_text: string
  section: string
  position: number
  evidence_ids: string[]
  claim_grounded: boolean
  governance_verdict: string | null
  provenance_ref: Record<string, unknown> | null
}

interface GovernancePanelProps {
  jobId: string
  claimId: string | null
  onClose: () => void
}

const VerdictIcon = ({ verdict }: { verdict: Verdict }) => {
  if (verdict === 'verified') return <ShieldCheck className="h-5 w-5 text-green-500" />
  if (verdict === 'contested') return <XCircle className="h-5 w-5 text-red-500" />
  return <AlertTriangle className="h-5 w-5 text-amber-500" />
}

const VerdictLabel = ({ verdict }: { verdict: Verdict }) => {
  const styles: Record<string, string> = {
    verified: 'bg-green-50 text-green-700 border-green-200',
    unverified: 'bg-amber-50 text-amber-700 border-amber-200',
    contested: 'bg-red-50 text-red-700 border-red-200',
  }
  const label = verdict ? verdict.charAt(0).toUpperCase() + verdict.slice(1) : 'Unknown'
  const style = verdict ? styles[verdict] : styles.unverified
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-sm font-medium ${style}`}>
      <VerdictIcon verdict={verdict} />
      {label}
    </span>
  )
}

export default function GovernancePanel({ jobId, claimId, onClose }: GovernancePanelProps) {
  const [claim, setClaim] = useState<Claim | null>(null)
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchClaim = useCallback(async (id: string) => {
    setLoading(true)
    setClaim(null)
    setEvidence([])

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: claimData, error: claimError } = await supabase
      .from('generated_claims')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!claimData || claimError) { setLoading(false); return }
    setClaim(claimData)

    const evidenceIds = Array.isArray(claimData.evidence_ids) ? claimData.evidence_ids : []
    if (evidenceIds.length > 0) {
      const { data: evidenceData } = await supabase
        .from('evidence_library')
        .select('id, source_title, content_snippet, source_type')
        .in('id', evidenceIds)
        .eq('user_id', user.id)

      if (evidenceData) {
        setEvidence(evidenceData.map(e => ({
          id: e.id,
          title: e.source_title,
          content_snippet: e.content_snippet ?? null,
          evidence_type: e.source_type,
        })))
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (claimId) fetchClaim(claimId)
    else { setClaim(null); setEvidence([]) }
  }, [claimId, fetchClaim])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const isOpen = !!claimId
  const verdict = (claim?.governance_verdict as Verdict) ?? 'unverified'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-96 max-w-full transform bg-white shadow-2xl transition-transform duration-200 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Governance Panel"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Claim Governance</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading claim data…
            </div>
          )}

          {!loading && !claim && claimId && (
            <p className="text-sm text-gray-500">No governance data found for this claim.</p>
          )}

          {!loading && !claimId && (
            <p className="text-sm text-gray-400 italic">Click a bullet to view its provenance.</p>
          )}

          {!loading && claim && (
            <>
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Claim</h3>
                <p className="text-sm text-gray-800 leading-relaxed">{claim.claim_text}</p>
              </section>

              <section>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Verification Status</h3>
                <VerdictLabel verdict={verdict} />
                {verdict === 'verified' && (
                  <p className="mt-2 text-xs text-gray-500">This claim is grounded in verified evidence from your library.</p>
                )}
                {verdict === 'unverified' && (
                  <p className="mt-2 text-xs text-gray-500">No matching evidence found. Review and update your evidence library to strengthen this claim.</p>
                )}
                {verdict === 'contested' && (
                  <p className="mt-2 text-xs text-gray-500">This claim could not be substantiated from the evidence provided. Consider revising or removing it.</p>
                )}
              </section>

              <section>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
                  Source Evidence {evidence.length > 0 ? `(${evidence.length})` : ''}
                </h3>
                {evidence.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No evidence linked to this claim.</p>
                ) : (
                  <ul className="space-y-3">
                    {evidence.map(item => (
                      <li key={item.id} className="rounded-lg border bg-gray-50 p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.evidence_type}</p>
                            {item.content_snippet && (
                              <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{item.content_snippet}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {claim.provenance_ref && (
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Provenance</h3>
                  <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                    {claim.provenance_ref.evidence_title && (
                      <p><span className="font-medium">Source:</span> {String(claim.provenance_ref.evidence_title)}</p>
                    )}
                    {claim.provenance_ref.source_evidence_id && (
                      <p className="text-gray-400 font-mono truncate">{String(claim.provenance_ref.source_evidence_id)}</p>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
