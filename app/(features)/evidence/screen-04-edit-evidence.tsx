'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { ArrowLeft, Save, AlertCircle, Lock, CheckCircle } from 'lucide-react';

/**
 * SCREEN 04 — EDIT EVIDENCE
 *
 * Edit an existing evidence item. Blocked on LOCKED items.
 *
 * Hard constraints:
 * - DEC-001: No business logic. UPDATE goes direct to Supabase (RLS-guarded).
 * - LOCKED items: form is disabled + clear explanation shown.
 *   RLS also enforces this server-side (locked=true rows have UPDATE blocked by policy).
 * - user_id is enforced by RLS — no manual ownership check needed in component.
 * - All async states: loading, saving, success, error.
 *
 * Data flow:
 * 1. Fetch evidence item by ID (RLS-guarded)
 * 2. If locked: show locked notice, read-only form, no save button
 * 3. If unlocked: pre-fill form, allow edits
 * 4. On submit: UPDATE evidence_library SET ... WHERE id = $id (RLS enforces ownership + lock)
 * 5. Success: redirect to Screen 03 (detail view)
 */

type EvidenceCategory =
  | 'achievement'
  | 'testimonial'
  | 'metric'
  | 'project_outcome'
  | 'skill'
  | 'other';

const CATEGORY_OPTIONS: { value: EvidenceCategory; label: string }[] = [
  { value: 'achievement', label: 'Achievement' },
  { value: 'metric', label: 'Metric' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'project_outcome', label: 'Project Outcome' },
  { value: 'skill', label: 'Skill' },
  { value: 'other', label: 'Other' },
];

interface FormState {
  title: string;
  content: string;
  category: EvidenceCategory;
  tags: string;
}

type SubmitStatus = 'idle' | 'saving' | 'success' | 'error';

interface Props {
  evidenceId: string;
  onBack?: () => void;
  onSaved?: (id: string) => void;
}

export function Screen04EditEvidence({ evidenceId, onBack, onSaved }: Props) {
  const { supabase } = useSupabase();
  const [form, setForm] = useState<FormState | null>(null);
  const [originalLocked, setOriginalLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const MAX_CONTENT = 2000;

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const { data, error } = await supabase
          .from('evidence_library')
          .select('id, title, content, category, tags, locked')
          .eq('id', evidenceId)
          .single();

        if (error) throw error;

        setOriginalLocked(data.locked === true);
        setForm({
          title: data.title,
          content: data.content,
          category: data.category as EvidenceCategory,
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        });
        setCharCount((data.content || '').length);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load evidence');
      } finally {
        setLoading(false);
      }
    };

    if (evidenceId) fetchItem();
  }, [evidenceId, supabase]);

  const isValid =
    form !== null &&
    form.title.trim().length >= 3 &&
    form.content.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !form || originalLocked) return;

    setSubmitStatus('saving');
    setSaveError(null);

    try {
      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { error: updateError } = await supabase
        .from('evidence_library')
        .update({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          tags: tagsArray,
        })
        .eq('id', evidenceId);

      if (updateError) throw updateError;

      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="h-6 w-24 bg-[#E5E7EB] rounded animate-pulse mb-8" />
          <Card className="bg-white p-8 space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#E5E7EB] rounded" />
            ))}
          </Card>
        </div>
      </div>
    );
  }

  // Fetch error
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full bg-[#FEF2F2] border border-[#EF4444] p-8 text-center" role="alert">
          <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-4" aria-hidden="true" />
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

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white border border-[#22C55E] p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-2">Changes Saved</h2>
          <p className="text-[#6B7280] mb-6">Your evidence has been updated.</p>
          <Button
            onClick={() => {
              if (onSaved) {
                onSaved(evidenceId);
              } else {
                window.location.href = `/evidence/${evidenceId}`;
              }
            }}
            className="w-full min-h-[44px] bg-[#22C55E] hover:bg-[#16A34A] text-white"
          >
            View Evidence
          </Button>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
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

        <h1 className="font-[Canela] text-4xl text-[#2C2926] mb-6">Edit Evidence</h1>

        {/* Locked warning */}
        {originalLocked && (
          <Card className="bg-[#F0FDF4] border border-[#22C55E] p-4 mb-6 flex items-center gap-3" role="note">
            <Lock className="w-5 h-5 text-[#22C55E] flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-[#15803D]">
              This evidence is LOCKED — it&apos;s backing a verified resume claim. To edit it, unlock it from the Governance view first.
            </p>
          </Card>
        )}

        {/* Save error */}
        {submitStatus === 'error' && saveError && (
          <Card className="bg-[#FEF2F2] border border-[#EF4444] p-4 mb-6 flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-[#EF4444] font-semibold text-sm">Save failed</p>
              <p className="text-sm text-[#EF4444] mt-1">{saveError}</p>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={originalLocked}>
            <Card className="bg-white border border-[#E5E7EB] p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-semibold text-[#2C2926] mb-2">
                  Title <span className="text-[#EF4444]" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] focus:outline-none focus:ring-2 focus:ring-[#D6AAA3] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed"
                  aria-required="true"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="edit-category" className="block text-sm font-semibold text-[#2C2926] mb-2">
                  Category <span className="text-[#EF4444]" aria-hidden="true">*</span>
                </label>
                <select
                  id="edit-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => f ? { ...f, category: e.target.value as EvidenceCategory } : f)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] focus:outline-none focus:ring-2 focus:ring-[#D6AAA3] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="edit-content" className="block text-sm font-semibold text-[#2C2926] mb-2">
                  Evidence <span className="text-[#EF4444]" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="edit-content"
                  value={form.content}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CONTENT) {
                      setForm((f) => f ? { ...f, content: e.target.value } : f);
                      setCharCount(e.target.value.length);
                    }
                  }}
                  rows={6}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] resize-none focus:outline-none focus:ring-2 focus:ring-[#D6AAA3] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed"
                  aria-required="true"
                  aria-describedby="edit-content-count"
                />
                <p
                  id="edit-content-count"
                  className={`text-xs mt-1 text-right ${charCount > MAX_CONTENT * 0.9 ? 'text-[#EAB308]' : 'text-[#9CA3AF]'}`}
                  aria-live="polite"
                >
                  {charCount}/{MAX_CONTENT}
                </p>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="edit-tags" className="block text-sm font-semibold text-[#2C2926] mb-2">
                  Tags <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <input
                  id="edit-tags"
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => f ? { ...f, tags: e.target.value } : f)}
                  placeholder="leadership, data analysis, product"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D6AAA3] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed"
                />
                {form.tags.trim() && !originalLocked && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.tags.split(',').filter((t) => t.trim()).map((tag, i) => (
                      <Badge key={i} className="bg-[#F3F4F6] text-[#6B7280] text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </fieldset>

          {/* Actions */}
          {!originalLocked && (
            <div className="flex gap-3 mt-6">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="min-h-[44px] border-[#E5E7EB] text-[#6B7280]"
                  disabled={submitStatus === 'saving'}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isValid || submitStatus === 'saving'}
                className="flex-1 min-h-[44px] bg-[#22C55E] hover:bg-[#16A34A] text-white disabled:opacity-50 gap-2"
              >
                {submitStatus === 'saving' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Screen04EditEvidence;
