'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { RotateCcw } from 'lucide-react';

/**
 * SCREEN 25 — GOVERNANCE VIEW
 * Read-only resume bullet inspection. Click any bullet → see source evidence with LOCKED stamp.
 * 
 * Hard constraints:
 * - DEC-002: Every bullet must trace to a source evidence_library row. No hallucinated claims.
 * - UI-only read. No edits here. All mutations happen in Screen 22 (resume edit).
 * 
 * Data flow:
 * 1. Fetch resume_claims for user (RLS-guarded)
 * 2. For each claim, fetch linked evidence_library row to show source
 * 3. Display LOCKED stamp + drift score badge on each claim
 */

interface SourceEvidence {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

interface ResumeClaim {
  id: string;
  bulletText: string;
  sourceEvidenceId: string;
  locked: boolean;
  driftScore: number; // 0-100, how different is bullet from source evidence
  sourceEvidence?: SourceEvidence;
  jobContext?: string;
}

interface EvidenceModal {
  open: boolean;
  claim?: ResumeClaim;
}

const StatusBadge = ({ locked, driftScore }: { locked: boolean; driftScore: number }) => {
  if (locked) {
    return <Badge className="bg-[#22C55E] text-white">LOCKED</Badge>;
  }

  if (driftScore > 30) {
    return (
      <Badge className="bg-[#EF4444] text-white">
        ⚠ Drift {driftScore}%
      </Badge>
    );
  }

  return (
    <Badge className="bg-[#EAB308] text-[#2C2926]">
      ◐ Unlocked
    </Badge>
  );
};

export function Screen25GovernanceView() {
  const { supabase, session } = useSupabase();
  const [claims, setClaims] = useState<ResumeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<EvidenceModal>({ open: false });

  // 1. Fetch all resume claims for user + linked evidence (RLS-guarded)
  const fetchClaims = async () => {
    if (!session?.user.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch resume_claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('resume_claims')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (claimsError) throw claimsError;

      // For each claim, fetch source evidence (this enforces DEC-002)
      const enrichedClaims: ResumeClaim[] = await Promise.all(
        (claimsData || []).map(async (claim) => {
          let sourceEvidence: SourceEvidence | undefined;

          try {
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('evidence_library')
              .select('id, title, content, category, created_at')
              .eq('id', claim.source_evidence_id)
              .single();

            if (!evidenceError && evidenceData) {
              sourceEvidence = {
                id: evidenceData.id,
                title: evidenceData.title,
                content: evidenceData.content,
                category: evidenceData.category,
                createdAt: evidenceData.created_at,
              };
            }
          } catch (err) {
            console.warn(`Could not fetch evidence for claim ${claim.id}:`, err);
          }

          return {
            id: claim.id,
            bulletText: claim.bullet_text,
            sourceEvidenceId: claim.source_evidence_id,
            locked: claim.locked === true,
            driftScore: claim.drift_score || 0,
            sourceEvidence,
            jobContext: claim.job_context,
          };
        })
      );

      setClaims(enrichedClaims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Open modal with evidence details
  const handleClaimClick = (claim: ResumeClaim) => {
    setModal({ open: true, claim });
  };

  // 3. Refresh data
  const handleRefresh = () => {
    fetchClaims();
  };

  // On mount, load claims
  useEffect(() => {
    fetchClaims();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8 flex items-center justify-center">
        <Card className="p-8 bg-white">
          <p className="text-[#2C2926]">Loading your resume claims...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="font-[Canela] text-5xl text-[#2C2926] mb-4">
              Resume Governance
            </h1>
            <p className="text-lg text-[#8E9878]">
              Every claim is traceable to verified evidence. Click any bullet to see the source.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="text-[#8E9878] border-[#8E9878]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Summary */}
        {claims.length > 0 && (
          <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
            <h2 className="font-semibold text-[#2C2926] mb-6">Claim Status</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#F7F2EB] p-4 rounded">
                <p className="text-3xl font-bold text-[#8E9878]">{claims.length}</p>
                <p className="text-sm text-[#2C2926] mt-2">Total Claims</p>
              </div>
              <div className="bg-[#F7F2EB] p-4 rounded">
                <p className="text-3xl font-bold text-[#22C55E]">
                  {claims.filter((c) => c.locked).length}
                </p>
                <p className="text-sm text-[#2C2926] mt-2">Locked</p>
              </div>
              <div className="bg-[#F7F2EB] p-4 rounded">
                <p className="text-3xl font-bold text-[#EAB308]">
                  {claims.filter((c) => !c.locked && c.driftScore <= 30).length}
                </p>
                <p className="text-sm text-[#2C2926] mt-2">Unlocked</p>
              </div>
              <div className="bg-[#F7F2EB] p-4 rounded">
                <p className="text-3xl font-bold text-[#EF4444]">
                  {claims.filter((c) => !c.locked && c.driftScore > 30).length}
                </p>
                <p className="text-sm text-[#2C2926] mt-2">High Drift</p>
              </div>
            </div>
          </Card>
        )}

        {/* Claims List */}
        {error && (
          <Card className="bg-[#EF4444] bg-opacity-10 border border-[#EF4444] p-6 mb-8">
            <p className="text-[#EF4444] font-semibold">Error loading claims</p>
            <p className="text-sm text-[#EF4444] mt-2">{error}</p>
          </Card>
        )}

        {claims.length === 0 ? (
          <Card className="bg-white border border-[#D6AAA3] p-12 text-center">
            <p className="text-[#8E9878] text-lg">No claims yet. Start building your resume to see claims here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <Card
                key={claim.id}
                onClick={() => handleClaimClick(claim)}
                className={`cursor-pointer border-l-4 p-6 transition-shadow hover:shadow-md ${
                  claim.locked
                    ? 'border-l-[#22C55E] bg-white'
                    : claim.driftScore > 30
                    ? 'border-l-[#EF4444] bg-white'
                    : 'border-l-[#EAB308] bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2926] mb-2">
                      {claim.bulletText}
                    </h3>
                    {claim.jobContext && (
                      <p className="text-sm text-[#8E9878] mb-3">
                        Context: {claim.jobContext}
                      </p>
                    )}
                    {claim.sourceEvidence && (
                      <p className="text-xs text-[#8E9878] italic">
                        From: {claim.sourceEvidence.category} — {claim.sourceEvidence.title}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="ml-4">
                    <StatusBadge locked={claim.locked} driftScore={claim.driftScore} />
                  </div>
                </div>

                {/* LOCKED Stamp Overlay (if locked) */}
                {claim.locked && (
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="relative w-24 h-24 opacity-20">
                      <span className="absolute inset-0 text-[#22C55E] font-bold text-lg transform -rotate-45 flex items-center justify-center whitespace-nowrap">
                        ✓ LOCKED
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Evidence Modal */}
        {modal.open && modal.claim && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setModal({ open: false })}
          >
            <Card
              className="bg-white max-w-2xl w-full p-8 max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-6">
                Source Evidence
              </h2>

              {modal.claim.sourceEvidence ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2C2926]">
                      Resume Claim
                    </label>
                    <p className="text-[#2C2926] bg-[#F7F2EB] p-4 rounded mt-2">
                      {modal.claim.bulletText}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2C2926]">
                      Source Evidence
                    </label>
                    <div className="bg-[#F7F2EB] p-4 rounded mt-2 border-l-4 border-l-[#22C55E]">
                      <h4 className="font-semibold text-[#2C2926]">
                        {modal.claim.sourceEvidence.title}
                      </h4>
                      <p className="text-xs text-[#8E9878] mt-1">
                        {modal.claim.sourceEvidence.category} · Added{' '}
                        {new Date(
                          modal.claim.sourceEvidence.createdAt
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-[#2C2926] mt-4 whitespace-pre-wrap text-sm">
                        {modal.claim.sourceEvidence.content}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#2C2926]">
                      Status
                    </label>
                    <div className="flex gap-4 mt-2">
                      <StatusBadge
                        locked={modal.claim.locked}
                        driftScore={modal.claim.driftScore}
                      />
                      {modal.claim.driftScore > 0 && (
                        <Badge variant="outline">
                          Drift: {modal.claim.driftScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#EF4444] bg-opacity-10 border border-[#EF4444] p-4 rounded">
                  <p className="text-[#EF4444] font-semibold">⚠ Missing Source</p>
                  <p className="text-sm text-[#EF4444] mt-2">
                    This claim has no linked evidence. This violates DEC-002. Edit this claim immediately.
                  </p>
                </div>
              )}

              <div className="mt-8 flex gap-4">
                <Button
                  onClick={() => setModal({ open: false })}
                  className="flex-1 bg-[#8E9878] hover:bg-[#6B7A5E] text-white"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default Screen25GovernanceView;
