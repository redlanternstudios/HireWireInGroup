'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { Tag, X, Plus, Save, ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * SCREEN 06 — TAG EVIDENCE
 *
 * Manage tags on a single evidence item inline, or batch-tag multiple items.
 * Tags drive job matching in the coach flow (Screens 10-17).
 *
 * Hard constraints:
 * - DEC-001: No business logic. Tag updates go direct to Supabase (RLS-guarded).
 * - LOCKED items: tag editing is read-only (locked evidence cannot be modified).
 * - Tags are stored as text[] on evidence_library.tags column.
 * - All async states: loading, saving, success, error.
 *
 * Data flow:
 * 1. Receive evidenceId as prop
 * 2. Fetch current tags from evidence_library
 * 3. User adds/removes tags inline
 * 4. On save: UPDATE evidence_library SET tags = $newTags WHERE id = $id
 * 5. Show suggested tags based on existing items in vault (common tags pool)
 */

const SUGGESTED_TAGS = [
  'leadership',
  'data analysis',
  'product management',
  'cross-functional',
  'strategy',
  'engineering',
  'design',
  'sales',
  'marketing',
  'customer success',
  'operations',
  'finance',
  'communication',
  'mentorship',
  'stakeholder management',
  'agile',
  'project management',
  'metrics',
  'growth',
  'process improvement',
];

interface EvidenceSummary {
  id: string;
  title: string;
  category: string;
  locked: boolean;
  tags: string[];
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  evidenceId: string;
  onBack?: () => void;
  onSaved?: (id: string, newTags: string[]) => void;
}

export function Screen06TagEvidence({ evidenceId, onBack, onSaved }: Props) {
  const { supabase } = useSupabase();
  const [item, setItem] = useState<EvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Working tag state
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = JSON.stringify(currentTags.sort()) !== JSON.stringify((item?.tags ?? []).slice().sort());

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const { data, error } = await supabase
          .from('evidence_library')
          .select('id, title, category, locked, tags')
          .eq('id', evidenceId)
          .single();

        if (error) throw error;

        const tags = Array.isArray(data.tags) ? data.tags : [];
        setItem({
          id: data.id,
          title: data.title,
          category: data.category,
          locked: data.locked === true,
          tags,
        });
        setCurrentTags(tags);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load evidence');
      } finally {
        setLoading(false);
      }
    };

    if (evidenceId) fetchItem();
  }, [evidenceId, supabase]);

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !currentTags.includes(normalized)) {
      setCurrentTags((prev) => [...prev, normalized]);
      setSaveStatus('idle');
    }
  };

  const removeTag = (tag: string) => {
    setCurrentTags((prev) => prev.filter((t) => t !== tag));
    setSaveStatus('idle');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (newTagInput.trim()) {
        addTag(newTagInput);
        setNewTagInput('');
      }
    }
    if (e.key === 'Backspace' && newTagInput === '' && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  const handleSave = async () => {
    if (!item || item.locked) return;

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const { error: updateError } = await supabase
        .from('evidence_library')
        .update({ tags: currentTags })
        .eq('id', evidenceId);

      if (updateError) throw updateError;

      setSaveStatus('saved');
      setItem((prev) => prev ? { ...prev, tags: currentTags } : prev);

      if (onSaved) {
        onSaved(evidenceId, currentTags);
      }

      // Reset save indicator after 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save tags');
    }
  };

  const suggestionsToShow = SUGGESTED_TAGS.filter(
    (s) => !currentTags.includes(s) &&
    (newTagInput === '' || s.includes(newTagInput.toLowerCase()))
  ).slice(0, 8);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="h-6 w-24 bg-[#E5E7EB] rounded mb-8" />
          <Card className="bg-white p-8 space-y-4">
            <div className="h-5 bg-[#E5E7EB] rounded w-1/2" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-16 bg-[#E5E7EB] rounded-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error
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

  if (!item) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#2C2926] transition-colors mb-8"
            aria-label="Back to evidence"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Tag className="w-6 h-6 text-[#8E9878]" aria-hidden="true" />
          <div>
            <h1 className="font-[Canela] text-3xl text-[#2C2926]">Manage Tags</h1>
            <p className="text-sm text-[#9CA3AF]">{item.title}</p>
          </div>
        </div>

        {/* Locked notice */}
        {item.locked && (
          <Card className="bg-[#F0FDF4] border border-[#22C55E] p-4 mb-6" role="note">
            <p className="text-sm text-[#15803D]">
              Tags on locked evidence are read-only. Unlock from Governance to edit.
            </p>
          </Card>
        )}

        {/* Save error */}
        {saveStatus === 'error' && saveError && (
          <Card className="bg-[#FEF2F2] border border-[#EF4444] p-4 mb-6 flex items-start gap-3" role="alert">
            <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-[#EF4444]">{saveError}</p>
          </Card>
        )}

        <Card className="bg-white border border-[#E5E7EB] p-6">
          {/* Tag input area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#2C2926] mb-3">
              Tags
            </label>

            {/* Current tags + input */}
            <div
              className={`min-h-[52px] flex flex-wrap gap-2 p-3 border rounded-lg transition-colors ${
                item.locked
                  ? 'bg-[#F9FAFB] border-[#E5E7EB]'
                  : 'bg-white border-[#E5E7EB] focus-within:ring-2 focus-within:ring-[#D6AAA3] focus-within:border-transparent'
              }`}
              role="group"
              aria-label="Current tags"
            >
              {currentTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-[#F3F4F6] text-[#2C2926] px-3 py-1 rounded-full text-sm"
                  aria-label={`Tag: ${tag}`}
                >
                  {tag}
                  {!item.locked && (
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors ml-0.5"
                      aria-label={`Remove tag: ${tag}`}
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </span>
              ))}

              {!item.locked && (
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={currentTags.length === 0 ? 'Add a tag…' : ''}
                  className="flex-1 min-w-[120px] outline-none text-sm text-[#2C2926] placeholder-[#9CA3AF] bg-transparent"
                  aria-label="Type a new tag and press Enter"
                  aria-describedby="tag-input-hint"
                />
              )}
            </div>
            <p id="tag-input-hint" className="text-xs text-[#9CA3AF] mt-1">
              Press Enter or comma to add. Backspace to remove the last tag.
            </p>
          </div>

          {/* Suggestions */}
          {!item.locked && suggestionsToShow.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#2C2926] mb-2">Suggested tags</p>
              <div className="flex flex-wrap gap-2">
                {suggestionsToShow.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => addTag(suggestion)}
                    className="flex items-center gap-1 text-xs text-[#6B7280] border border-dashed border-[#D1D5DB] px-2.5 py-1 rounded-full hover:border-[#8E9878] hover:text-[#2C2926] transition-colors"
                    aria-label={`Add tag: ${suggestion}`}
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty tags state */}
          {currentTags.length === 0 && !item.locked && (
            <div className="mt-4 py-4 border-t border-[#E5E7EB] text-center">
              <p className="text-sm text-[#9CA3AF]">
                No tags yet. Tags help the coach match this evidence to job requirements.
              </p>
            </div>
          )}
        </Card>

        {/* Actions */}
        {!item.locked && (
          <div className="flex gap-3 mt-6">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="min-h-[44px] border-[#E5E7EB] text-[#6B7280]"
                disabled={saveStatus === 'saving'}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || saveStatus === 'saving'}
              className={`flex-1 min-h-[44px] gap-2 ${
                saveStatus === 'saved'
                  ? 'bg-[#22C55E] hover:bg-[#16A34A]'
                  : 'bg-[#8E9878] hover:bg-[#6B7A5E]'
              } text-white disabled:opacity-50`}
              aria-live="polite"
            >
              {saveStatus === 'saving' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  Save Tags
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tag count info */}
        <p className="text-xs text-[#9CA3AF] text-center mt-4" aria-live="polite">
          {currentTags.length} tag{currentTags.length !== 1 ? 's' : ''} · {isDirty ? 'Unsaved changes' : 'All saved'}
        </p>
      </div>
    </div>
  );
}

export default Screen06TagEvidence;
