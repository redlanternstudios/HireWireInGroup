'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { Pencil, Trash2, Lock, ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * SCREEN 03 — EVIDENCE DETAIL
 *
 * View a single evidence item in full detail.
 * Entry point to Screen 04 (edit) and Screen 05 (delete confirm).
 *
 * Hard constraints:
 * - DEC-001: No business logic. All reads are direct Supabase (RLS-guarded).
 * - LOCKED evidence: shows read-only view. Edit/delete disabled.
 *   LOCKED items can only be unlocked via governance flow — not here.
 * - user_id is enforced by RLS. No manual filtering needed.
 *
 * Data flow:
 * 1. Receive evidenceId as prop (from URL param / parent)
 * 2. SELECT * FROM evidence_library WHERE id = $evidenceId (RLS enforces ownership)
 * 3. If LOCKED: read-only, show LOCKED stamp, no edit/delete
 * 4. If unlocked: show Edit + Delete buttons
 */

type EvidenceCategory =
  | 'achievement'
  | 'testimonial'
  | 'metric'
  | 'project_outcome'
  | 'skill'
  | 'other';

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  achievement: 'Achievement',
  testimonial: 'Testimonial',
  metric: 'Metric',
  project_outcome: 'Project Outcome',
  skill: 'Skill',
  other: 'Other',
};

const CATEGORY_COLORS: Record<EvidenceCategory, string> = {
  achievement: 'bg-[#22C55E] text-white',
  testimonial: 'bg-[#D6AAA3] text-[#2C2926]',
  metric: 'bg-[#EAB308] text-[#2C2926]',
  project_outcome: 'bg-[#8E9878] text-white',
  skill: 'bg-[#9CA3AF] text-white',
  other: 'bg-[#E5E7EB] text-[#2C2926]',
};

interface EvidenceDetail {
  id: string;
  title: string;
  content: string;
  category: EvidenceCategory;
  locked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  evidenceId: string;
  onBack?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function Screen03EvidenceDetail({ evidenceId, onBack, onEdit, onDelete }: Props) {
  const { supabase } = useSupabase();
  const [item, setItem] = useState<EvidenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('evidence_library')
          .select('*')
          .eq('id', evidenceId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Evidence not found or you do not have access to it.');
          } else {
            throw fetchError;
          }
          return;
        }

        setItem({
          id: data.id,
          title: data.title,
          content: data.content,
          category: data.category as EvidenceCategory,
          locked: data.locked === true,
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load evidence');
      } finally {
        setLoading(false);
      }
    };

    if (evidenceId) fetchDetail();
  }, [evidenceId, supabase]);

  const handleDelete = async () => {
    if (!item || item.locked) return;

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('evidence_library')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      if (onDelete) {
        onDelete(item.id);
      } else {
        window.location.href = '/evidence';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete evidence');
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-32 bg-[#E5E7EB] rounded animate-pulse mb-8" />
          <Card className="bg-white p-8 space-y-4 animate-pulse">
            <div className="h-7 bg-[#E5E7EB] rounded w-3/4" />
            <div className="h-4 bg-[#E5E7EB] rounded w-1/4" />
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-[#E5E7EB] rounded w-full" />
              <div className="h-3 bg-[#E5E7EB] rounded w-full" />
              <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#2C2926] mb-8"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
            </button>
          )}
          <Card
            className="bg-[#FEF2F2] border border-[#EF4444] p-8 text-center"
            role="alert"
          >
            <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-4" aria-hidden="true" />
            <p className="text-[#EF4444] font-semibold">{error}</p>
            <Button
              onClick={() => window.location.href = '/evidence'}
              variant="outline"
              className="mt-4 border-[#EF4444] text-[#EF4444]"
            >
              Back to Vault
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const borderColor = item.locked ? 'border-l-[#22C55E]' : 'border-l-[#EAB308]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Back nav */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#2C2926] transition-colors mb-8"
            aria-label="Back to Evidence Vault"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Evidence Vault
          </button>
        )}

        {/* Evidence card */}
        <Card className={`relative bg-white border-l-4 ${borderColor} overflow-hidden`}>
          {/* LOCKED visual overlay */}
          {item.locked && (
            <div
              className="absolute inset-0 pointer-events-none select-none z-0"
              aria-hidden="true"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 18px,
                  rgba(229, 231, 235, 0.3) 18px,
                  rgba(229, 231, 235, 0.3) 20px
                )`,
              }}
            />
          )}

          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={CATEGORY_COLORS[item.category]}>
                    {CATEGORY_LABELS[item.category]}
                  </Badge>
                  {item.locked && (
                    <Badge className="bg-[#22C55E] text-white flex items-center gap-1">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      LOCKED
                    </Badge>
                  )}
                </div>
                <h1 className="font-[Canela] text-2xl md:text-3xl text-[#2C2926]">
                  {item.title}
                </h1>
              </div>
            </div>

            {/* Locked notice */}
            {item.locked && (
              <div className="bg-[#F0FDF4] border border-[#22C55E] rounded-lg p-4 mb-6 flex items-center gap-3">
                <Lock className="w-4 h-4 text-[#22C55E] flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-[#15803D]">
                  This evidence is locked. It&apos;s backing a verified resume claim and cannot be edited here. Unlock it from the Governance view.
                </p>
              </div>
            )}

            {/* Content */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-[#2C2926] mb-2">Evidence</h2>
              <p className="text-[#2C2926] leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[#2C2926] mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#F3F4F6] text-[#6B7280] px-3 py-1 rounded-full"
                      aria-label={`Tag: ${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="border-t border-[#E5E7EB] pt-4 flex justify-between text-xs text-[#9CA3AF]">
              <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
              {item.updatedAt !== item.createdAt && (
                <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        {!item.locked && (
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                if (onEdit) {
                  onEdit(item.id);
                } else {
                  window.location.href = `/evidence/${item.id}/edit`;
                }
              }}
              variant="outline"
              className="flex-1 min-h-[44px] border-[#E5E7EB] text-[#2C2926] gap-2"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              onClick={() => setDeleteConfirmOpen(true)}
              variant="outline"
              className="min-h-[44px] border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] gap-2"
              aria-label="Delete this evidence item"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={() => !deleting && setDeleteConfirmOpen(false)}
        >
          <Card
            className="bg-white max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-modal-title"
              className="font-[Canela] text-xl text-[#2C2926] mb-3"
            >
              Delete this evidence?
            </h2>
            <p className="text-sm text-[#6B7280] mb-6">
              <strong className="text-[#2C2926]">{item.title}</strong> will be permanently removed.
              If it&apos;s backing any resume claims, those claims will lose their source.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirmOpen(false)}
                variant="outline"
                className="flex-1 min-h-[44px]"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 min-h-[44px] bg-[#EF4444] hover:bg-[#DC2626] text-white gap-2"
                disabled={deleting}
                aria-busy={deleting}
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Screen03EvidenceDetail;
