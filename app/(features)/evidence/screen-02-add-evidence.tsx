'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * SCREEN 02 — ADD EVIDENCE
 *
 * Upload/create a new evidence item into evidence_library.
 *
 * Hard constraints:
 * - DEC-001: No business logic. POST goes to Supabase via RLS-scoped browser client.
 *   user_id is set via RLS (auth.uid()) — not injected by the component.
 * - DEC-002: Every evidence item becomes a potential source for resume claims.
 * - All async states: saving, success, error.
 * - File uploads are NOT handled here — text/manual entry only in Phase 2.
 *   File upload (if added) must go through BACKEND's signed URL flow.
 *
 * Data flow:
 * 1. User fills form: title, content, category, tags
 * 2. On submit: INSERT into evidence_library (RLS sets user_id = auth.uid())
 * 3. Success: redirect to Screen 01 (vault list)
 * 4. Error: inline error with retry
 */

type EvidenceCategory = 'achievement' | 'testimonial' | 'metric' | 'project_outcome' | 'skill' | 'other';

const CATEGORY_OPTIONS: { value: EvidenceCategory; label: string; description: string }[] = [
  { value: 'achievement', label: 'Achievement', description: 'Something you accomplished — result + impact' },
  { value: 'metric', label: 'Metric', description: 'A number that proves your impact (%, $, time)' },
  { value: 'testimonial', label: 'Testimonial', description: 'Feedback from a colleague, manager, or client' },
  { value: 'project_outcome', label: 'Project Outcome', description: 'The result of a project you led or contributed to' },
  { value: 'skill', label: 'Skill', description: 'A demonstrated skill with context (not just a word)' },
  { value: 'other', label: 'Other', description: 'Anything else worth capturing' },
];

interface FormState {
  title: string;
  content: string;
  category: EvidenceCategory | '';
  tags: string;
}

type SubmitStatus = 'idle' | 'saving' | 'success' | 'error';

export function Screen02AddEvidence({ onBack }: { onBack?: () => void }) {
  const { supabase, session } = useSupabase();

  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const MAX_CONTENT_LENGTH = 2000;

  const handleContentChange = (value: string) => {
    if (value.length <= MAX_CONTENT_LENGTH) {
      setForm((f) => ({ ...f, content: value }));
      setCharCount(value.length);
    }
  };

  const isValid =
    form.title.trim().length >= 3 &&
    form.content.trim().length >= 10 &&
    form.category !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !session?.user.id) return;

    setSubmitStatus('saving');
    setErrorMessage(null);

    try {
      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { error: insertError } = await supabase
        .from('evidence_library')
        .insert({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          tags: tagsArray,
          locked: false,
          // user_id is set by RLS trigger: auth.uid()
        });

      if (insertError) throw insertError;

      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save evidence');
    }
  };

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white border border-[#22C55E] p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-2">Evidence Added</h2>
          <p className="text-[#6B7280] mb-6">
            Your evidence is saved and ready to back up resume claims.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setForm({ title: '', content: '', category: '', tags: '' });
                setSubmitStatus('idle');
                setCharCount(0);
              }}
              variant="outline"
              className="flex-1 min-h-[44px] border-[#22C55E] text-[#22C55E]"
            >
              Add Another
            </Button>
            <Button
              onClick={() => window.location.href = '/evidence'}
              className="flex-1 min-h-[44px] bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              Back to Vault
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="text-[#9CA3AF] hover:text-[#2C2926] transition-colors"
              aria-label="Go back"
            >
              ← Back
            </button>
          )}
          <div>
            <h1 className="font-[Canela] text-4xl text-[#2C2926]">Add Evidence</h1>
            <p className="text-[#6B7280] mt-1">
              Capture a concrete piece of your career story.
            </p>
          </div>
        </div>

        {/* Error banner */}
        {submitStatus === 'error' && errorMessage && (
          <Card
            className="bg-[#FEF2F2] border border-[#EF4444] p-4 mb-6 flex items-start gap-3"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-[#EF4444] font-semibold text-sm">Save failed</p>
              <p className="text-sm text-[#EF4444] mt-1">{errorMessage}</p>
            </div>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <Card className="bg-white border border-[#E5E7EB] p-6 space-y-6">

            {/* Title */}
            <div>
              <label
                htmlFor="evidence-title"
                className="block text-sm font-semibold text-[#2C2926] mb-2"
              >
                Title <span className="text-[#EF4444]" aria-hidden="true">*</span>
              </label>
              <input
                id="evidence-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Led rebranding project that increased signups 40%"
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D6AAA3]"
                aria-required="true"
                aria-describedby="title-hint"
              />
              <p id="title-hint" className="text-xs text-[#9CA3AF] mt-1">
                A short, specific headline for this evidence item.
              </p>
            </div>

            {/* Category */}
            <div>
              <fieldset>
                <legend className="block text-sm font-semibold text-[#2C2926] mb-3">
                  Category <span className="text-[#EF4444]" aria-hidden="true">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.category === opt.value
                          ? 'border-[#22C55E] bg-[#F0FDF4]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#D6AAA3]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={opt.value}
                        checked={form.category === opt.value}
                        onChange={() => setForm((f) => ({ ...f, category: opt.value }))}
                        className="mt-0.5 accent-[#22C55E]"
                        aria-describedby={`cat-desc-${opt.value}`}
                      />
                      <div>
                        <span className="text-sm font-medium text-[#2C2926]">{opt.label}</span>
                        <p
                          id={`cat-desc-${opt.value}`}
                          className="text-xs text-[#9CA3AF] mt-0.5"
                        >
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="evidence-content"
                className="block text-sm font-semibold text-[#2C2926] mb-2"
              >
                Evidence <span className="text-[#EF4444]" aria-hidden="true">*</span>
              </label>
              <textarea
                id="evidence-content"
                required
                value={form.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Describe the specific situation, what you did, and the result. The more specific, the better it will hold up as resume evidence."
                rows={5}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#D6AAA3]"
                aria-required="true"
                aria-describedby="content-hint content-count"
              />
              <div className="flex justify-between mt-1">
                <p id="content-hint" className="text-xs text-[#9CA3AF]">
                  Be specific: situation → action → result.
                </p>
                <p
                  id="content-count"
                  className={`text-xs ${charCount > MAX_CONTENT_LENGTH * 0.9 ? 'text-[#EAB308]' : 'text-[#9CA3AF]'}`}
                  aria-live="polite"
                >
                  {charCount}/{MAX_CONTENT_LENGTH}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="evidence-tags"
                className="block text-sm font-semibold text-[#2C2926] mb-2"
              >
                Tags <span className="text-[#9CA3AF] font-normal">(optional)</span>
              </label>
              <input
                id="evidence-tags"
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="leadership, data analysis, product management"
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#2C2926] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D6AAA3]"
                aria-describedby="tags-hint"
              />
              <p id="tags-hint" className="text-xs text-[#9CA3AF] mt-1">
                Comma-separated. Tags help the coach match your evidence to job requirements.
              </p>
              {/* Tag preview */}
              {form.tags.trim() && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.tags.split(',').filter((t) => t.trim()).map((tag, i) => (
                    <Badge
                      key={i}
                      className="bg-[#F3F4F6] text-[#6B7280] text-xs"
                      aria-label={`Tag: ${tag.trim()}`}
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
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
              className="flex-1 min-h-[44px] bg-[#22C55E] hover:bg-[#16A34A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={!isValid || submitStatus === 'saving'}
            >
              {submitStatus === 'saving' ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Save Evidence
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Screen02AddEvidence;
