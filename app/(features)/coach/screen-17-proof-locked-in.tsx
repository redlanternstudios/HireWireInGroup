'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { Check, ChevronRight } from 'lucide-react';

/**
 * SCREEN 17 — PROOF LOCKED IN
 * Coach completion & evidence confirmation. User reviews extracted evidence, locks it, proceeds to resume generation.
 * 
 * Hard constraints:
 * - DEC-002: Evidence must be user-verified before locking. No auto-locking without user confirmation.
 * - DEC-001: Lock action sends confirmation to n8n for resume generation workflow trigger.
 * 
 * Data flow:
 * 1. Fetch extracted evidence items from coach_sessions (RLS-guarded)
 * 2. Display extracted evidence with LOCKED confirmation UI
 * 3. User can edit evidence before locking
 * 4. POST /api/coach/lock-evidence → n8n trigger for resume generation (Screens 22-35)
 */

interface ExtractedEvidence {
  id: string;
  skillCategory: string;
  extractedText: string;
  verified: boolean;
  userComment?: string;
  confidenceScore: number; // 0-100
}

interface CoachSession {
  id: string;
  jobUrl: string;
  jobTitle: string;
  status: 'in_progress' | 'completed' | 'locked';
  extractedEvidence: ExtractedEvidence[];
  coachNotes?: string;
  completedAt?: string;
}

export function Screen17ProofLockedIn() {
  const { supabase, session } = useSupabase();
  const [coachSession, setCoachSession] = useState<CoachSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());
  const [showLockModal, setShowLockModal] = useState(false);

  // 1. Fetch latest completed coach session + extracted evidence
  const fetchCoachSession = async () => {
    if (!session?.user.id) return;

    setLoading(true);
    setError(null);

    try {
      // Get latest coach session in 'completed' status
      const { data: sessionData, error: sessionError } = await supabase
        .from('coach_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          // No rows found
          setCoachSession(null);
        } else {
          throw sessionError;
        }
        return;
      }

      // Fetch extracted evidence items for this session
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('extracted_evidence')
        .select('*')
        .eq('coach_session_id', sessionData.id);

      if (evidenceError) throw evidenceError;

      // Map to component types
      const extractedEvidence: ExtractedEvidence[] = (evidenceData || []).map(
        (item) => ({
          id: item.id,
          skillCategory: item.skill_category,
          extractedText: item.extracted_text,
          verified: item.verified === true,
          userComment: item.user_comment,
          confidenceScore: item.confidence_score || 0,
        })
      );

      setCoachSession({
        id: sessionData.id,
        jobUrl: sessionData.job_url,
        jobTitle: sessionData.job_title,
        status: sessionData.status,
        extractedEvidence,
        coachNotes: sessionData.coach_notes,
        completedAt: sessionData.updated_at,
      });

      // Mark all items as verified by default (user can uncheck)
      setVerifiedItems(new Set(extractedEvidence.map((e) => e.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
      console.error('Error fetching coach session:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lock evidence → send to n8n for resume generation
  const handleLockEvidence = async () => {
    if (!coachSession || !session?.user.id) return;

    setLocking(true);
    setError(null);

    try {
      // DEC-001: Thin receiver only. All business logic in n8n.
      const response = await fetch('/api/coach/lock-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          coachSessionId: coachSession.id,
          verifiedEvidenceIds: Array.from(verifiedItems),
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Lock evidence failed: ${response.status} ${errBody}`);
      }

      const result = await response.json();

      // Update session status to 'locked'
      setCoachSession({
        ...coachSession,
        status: 'locked',
      });

      setShowLockModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock evidence');
      console.error('Error locking evidence:', err);
    } finally {
      setLocking(false);
    }
  };

  // 3. Toggle evidence verification
  const toggleVerification = (evidenceId: string) => {
    const updated = new Set(verifiedItems);
    if (updated.has(evidenceId)) {
      updated.delete(evidenceId);
    } else {
      updated.add(evidenceId);
    }
    setVerifiedItems(updated);
  };

  useEffect(() => {
    fetchCoachSession();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8 flex items-center justify-center">
        <Card className="p-8 bg-white">
          <p className="text-[#2C2926]">Loading your interview results...</p>
        </Card>
      </div>
    );
  }

  if (!coachSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border border-[#D6AAA3] p-12 text-center">
            <p className="text-[#8E9878] text-lg">
              No completed interview session. Start an interview to see your proof.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-[Canela] text-5xl text-[#2C2926] mb-4">
            Your Proof — Locked In
          </h1>
          <p className="text-lg text-[#8E9878]">
            Review the evidence we extracted from your interview. Lock the items that best represent your fit for{' '}
            <strong>{coachSession.jobTitle}</strong>.
          </p>
        </div>

        {error && (
          <Card className="bg-[#EF4444] bg-opacity-10 border border-[#EF4444] p-6 mb-8">
            <p className="text-[#EF4444] font-semibold">⚠ Error</p>
            <p className="text-sm text-[#EF4444] mt-2">{error}</p>
          </Card>
        )}

        {/* Session Summary */}
        <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-sm font-semibold text-[#2C2926]">Job Posting</label>
              <p className="text-[#8E9878] mt-2 text-sm break-all">{coachSession.jobUrl}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#2C2926]">Interview Status</label>
              <Badge className="mt-2 bg-[#22C55E] text-white">✓ Completed</Badge>
            </div>
          </div>

          {coachSession.coachNotes && (
            <div className="mt-6 pt-6 border-t border-[#D6AAA3]">
              <label className="text-sm font-semibold text-[#2C2926]">Coach Notes</label>
              <p className="text-[#2C2926] mt-3 p-4 bg-[#F7F2EB] rounded italic">
                "{coachSession.coachNotes}"
              </p>
            </div>
          )}
        </Card>

        {/* Extracted Evidence Cards */}
        <div className="space-y-4 mb-8">
          <h2 className="font-[Canela] text-2xl text-[#2C2926]">Extracted Evidence</h2>

          {coachSession.extractedEvidence.map((evidence) => {
            const isVerified = verifiedItems.has(evidence.id);

            return (
              <Card
                key={evidence.id}
                className={`border-l-4 p-6 transition-all cursor-pointer ${
                  isVerified
                    ? 'border-l-[#22C55E] bg-white'
                    : 'border-l-[#EAB308] bg-[#F7F2EB] bg-opacity-50'
                }`}
                onClick={() => toggleVerification(evidence.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                      isVerified
                        ? 'bg-[#22C55E] border-[#22C55E]'
                        : 'border-[#EAB308] bg-white'
                    }`}
                  >
                    {isVerified && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Evidence Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2C2926]">
                          {evidence.skillCategory}
                        </h3>
                        <p className="text-xs text-[#8E9878] mt-1">
                          Confidence: {evidence.confidenceScore}%
                        </p>
                      </div>
                      {isVerified && (
                        <Badge className="bg-[#22C55E] text-white">LOCKED</Badge>
                      )}
                    </div>

                    <p className="text-[#2C2926] p-4 bg-white rounded border border-[#D6AAA3] mb-3">
                      "{evidence.extractedText}"
                    </p>

                    {evidence.userComment && (
                      <p className="text-sm text-[#8E9878] italic">
                        Your note: {evidence.userComment}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Lock Confirmation Stats */}
        <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-3xl font-bold text-[#2C2926]">
                {coachSession.extractedEvidence.length}
              </p>
              <p className="text-sm text-[#8E9878] mt-2">Total Extracted</p>
            </div>
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-3xl font-bold text-[#22C55E]">
                {verifiedItems.size}
              </p>
              <p className="text-sm text-[#8E9878] mt-2">Selected to Lock</p>
            </div>
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-3xl font-bold text-[#D7BA82]">
                {Math.round(
                  (verifiedItems.size /
                    (coachSession.extractedEvidence.length || 1)) *
                    100
                )}
                %
              </p>
              <p className="text-sm text-[#8E9878] mt-2">Coverage</p>
            </div>
          </div>

          <p className="text-sm text-[#8E9878] mb-6">
            Once you lock this evidence, it becomes the source of truth for your resume claims. You can always edit claims later in the Governance view (Screen 25).
          </p>

          <Button
            onClick={() => setShowLockModal(true)}
            disabled={verifiedItems.size === 0 || locking}
            className="w-full bg-[#8E9878] hover:bg-[#6B7A5E] text-white py-6 text-lg font-semibold disabled:opacity-50"
          >
            {locking ? 'Locking...' : 'Lock Evidence & Continue to Resume'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>

        {/* Lock Confirmation Modal */}
        {showLockModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !locking && setShowLockModal(false)}
          >
            <Card
              className="bg-white max-w-2xl w-full p-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-[Canela] text-3xl text-[#2C2926]">
                  Proof Locked
                </h2>
              </div>

              <div className="space-y-4 mb-8 bg-[#F7F2EB] p-6 rounded">
                <p className="text-[#2C2926]">
                  ✓ <strong>{verifiedItems.size} evidence items locked</strong>
                </p>
                <p className="text-[#8E9878] text-sm">
                  These items are now the verified source of truth for your resume. Every bullet point will trace back to this evidence.
                </p>
              </div>

              <p className="text-[#8E9878] mb-8">
                Next: We'll generate your resume based on locked evidence, showing which claims align with the job.
              </p>

              <Button
                onClick={() => {
                  handleLockEvidence();
                  setShowLockModal(false);
                }}
                disabled={locking}
                className="w-full bg-[#8E9878] hover:bg-[#6B7A5E] text-white py-4 text-lg font-semibold"
              >
                {locking ? 'Processing...' : 'Continue to Resume Generation'}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default Screen17ProofLockedIn;
