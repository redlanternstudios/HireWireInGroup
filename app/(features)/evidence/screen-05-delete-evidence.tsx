'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/lib/supabase/client';
import { Trash2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';

/**
 * SCREEN 05 — DELETE EVIDENCE CONFIRMATION
 *
 * Dedicated delete confirmation screen. Shows downstream impact warning
 * (how many resume claims this evidence backs).
 *
 * Hard constraints:
 * - DEC-001: No business logic. DELETE goes direct to Supabase (RLS-guarded).
 * - LOCKED items: delete is BLOCKED in the UI and at the DB level (RLS policy).
 * - Downstream impact: show count of resume_claims backed by this evidence
 *   so user knows what they're breaking before confirming.
 * - All async states: loading, deleting, deleted, error.
 *
 * Data flow:
 * 1. Fetch evidence item + count of linked resume_claims
 * 2. If locked: show lock notice, no delete button
 * 3. If unlocked: show impact warning, require typed confirmation if claims > 0
 * 4. On confirm: DELETE evidence_library WHERE id = $id (cascades in DB)
 * 5. Redirect to Evidence Vault
 */

interface EvidenceToDelete {
  id: string;
  title: string;
  category: string;
  locked: boolean;
  linkedClaimsCount: number;
}

type DeleteStatus = 'idle' | 'deleting' | 'deleted' | 'error';

interface Props {
  evidenceId: string;
  onBack?: () => void;
  onDeleted?: () => void;
}

export function Screen05DeleteEvidence({ evidenceId, onBack, onDeleted }: Props) {
  const { supabase } = useSupabase();
  const [item, setItem] = useState<EvidenceToDelete | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  // High-risk delete (has linked claims) requires typed confirmation
  const requiresTypedConfirm = (item?.linkedClaimsCount ?? 0) > 0;
  const typedConfirmTarget = 'DELETE';
  const canDelete =
    item !== null &&
    !item.locked &&
    deleteStatus === 'idle' &&
    (!requiresTypedConfirm || confirmText === typedConfirmTarget);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        // Fetch evidence item
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('evidence_library')
          .select('id, title, category, locked')
          .eq('id', evidenceId)
          .single();

        if (evidenceError) throw evidenceError;

        // Count linked resume claims (soft check — RLS-guarded)
        const { count, error: countError } = await supabase
          .from('resume_claims')
          .select('id', { count: 'exact', head: true })
          .eq('source_evidence_id', evidenceId);

        if (countError) {
          console.warn('Could not count linked claims:', countError);
        }

        setItem({
          id: evidenceData.id,
          title: evidenceData.title,
          category: evidenceData.category,
          locked: evidenceData.locked === true,
          linkedClaimsCount: count ?? 0,
        });
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load evidence');
      } finally {
        setLoading(false);
      }
    };

    if (evidenceId) fetchItem();
  }, [evidenceId, supabase]);

  const handleDelete = async () => {
    if (!canDelete || !item) return;

    setDeleteStatus('deleting');
    setDeleteError(null);

    try {
      const { error: deleteError } = await supabase
        .from('evidence_library')
        .delete()
        .eq('id', evidenceId);

      if (deleteError) throw deleteError;

      setDeleteStatus('deleted');
      setTimeout(() => {
        if (onDeleted) {
          onDeleted();
        } else {
          window.location.href = '/evidence';
        }
      }, 1500);
    } catch (err) {
      setDeleteStatus('error');
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete evidence');
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white p-8 animate-pulse">
          <div className="h-6 bg-[#E5E7EB] rounded w-3/4 mb-4" />
          <div className="h-4 bg-[#E5E7EB] rounded w-full mb-2" />
          <div className="h-4 bg-[#E5E7EB] rounded w-2/3" />
        </Card>
      </div>
    );
  }

  // Fetch error
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full bg-[#FEF2F2] border border-[#EF4444] p-8 text-center" role="alert">
          <p className="text-[#EF4444] font-semibold">{fetchError}</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4 border-[#EF4444] text-[#EF4444]">
              Go Back
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Deleted
  if (deleteStatus === 'deleted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white p-8 text-center">
          <Trash2 className="w-10 h-10 text-[#9CA3AF] mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-2">Evidence Deleted</h2>
          <p className="text-[#6B7280] text-sm">Redirecting to your vault…</p>
        </Card>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#2C2926] transition-colors mb-8"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
        )}

        <h1 className="font-[Canela] text-4xl text-[#2C2926] mb-6">Delete Evidence</h1>

        {/* LOCKED notice — delete blocked */}
        {item.locked ? (
          <Card className="bg-[#F0FDF4] border border-[#22C55E] p-6 flex items-start gap-4" role="note">
            <Lock className="w-6 h-6 text-[#22C55E] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-[#15803D] mb-1">Cannot delete — evidence is LOCKED</h2>
              <p className="text-sm text-[#15803D]">
                <strong>{item.title}</strong> is backing a verified resume claim. Unlock it from the Governance view before deleting.
              </p>
              {onBack && (
                <Button onClick={onBack} variant="outline" className="mt-4 border-[#22C55E] text-[#22C55E]">
                  Go Back
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Evidence summary card */}
            <Card className="bg-white border-l-4 border-l-[#EF4444] p-6 mb-6">
              <p className="text-sm text-[#9CA3AF] uppercase tracking-wide mb-1">{item.category}</p>
              <h2 className="font-semibold text-[#2C2926] text-lg">{item.title}</h2>
            </Card>

            {/* Downstream impact warning */}
            {item.linkedClaimsCount > 0 && (
              <Card
                className="bg-[#FFFBEB] border border-[#EAB308] p-5 mb-6 flex items-start gap-3"
                role="alert"
              >
                <AlertTriangle className="w-5 h-5 text-[#EAB308] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#92400E] text-sm">
                    {item.linkedClaimsCount} resume claim{item.linkedClaimsCount !== 1 ? 's' : ''} will lose their source
                  </p>
                  <p className="text-sm text-[#92400E] mt-1">
                    These claims will become orphaned and flagged in the Governance view. You should update them before deleting.
                  </p>
                </div>
              </Card>
            )}

            {/* Delete error */}
            {deleteStatus === 'error' && deleteError && (
              <Card className="bg-[#FEF2F2] border border-[#EF4444] p-4 mb-6" role="alert">
                <p className="text-[#EF4444] font-semibold text-sm">Delete failed</p>
                <p className="text-sm text-[#EF4444] mt-1">{deleteError}</p>
              </Card>
            )}

            {/* Typed confirmation (if high-risk) */}
            {requiresTypedConfirm && (
              <div className="mb-6">
                <label htmlFor="confirm-delete" className="block text-sm font-semibold text-[#2C2926] mb-2">
                  Type <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#EF4444]">DELETE</code> to confirm
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                  aria-describedby="confirm-hint"
                  autoComplete="off"
                />
                <p id="confirm-hint" className="text-xs text-[#9CA3AF] mt-1">
                  This confirms you understand {item.linkedClaimsCount} resume claim{item.linkedClaimsCount !== 1 ? 's' : ''} will lose their source.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 min-h-[44px] border-[#E5E7EB] text-[#6B7280]"
                  disabled={deleteStatus === 'deleting'}
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleDelete}
                disabled={!canDelete}
                className="flex-1 min-h-[44px] bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-40 disabled:cursor-not-allowed gap-2"
                aria-disabled={!canDelete}
              >
                {deleteStatus === 'deleting' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete Evidence
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Screen05DeleteEvidence;
