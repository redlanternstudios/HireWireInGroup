'use client';

import { Card } from '@/components/ui/card';

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
        (claimsData || []).map(async (claim: Record<string, unknown>) => {
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
            id: claim.id as string,
            bulletText: claim.bullet_text as string,
            sourceEvidenceId: claim.source_evidence_id as string,
            locked: claim.locked === true,
            driftScore: (claim.drift_score as number) || 0,
            sourceEvidence,
            jobContext: claim.job_context as string | undefined,
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
    <Card className="p-8">
      <h1 className="text-2xl font-bold mb-4">Governance View</h1>
      <p className="text-gray-600">Resume claim verification interface coming soon.</p>
    </Card>
  );
}

export default Screen25GovernanceView;
