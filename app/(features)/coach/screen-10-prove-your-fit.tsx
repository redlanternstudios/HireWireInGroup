'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

/**
 * SCREEN 10 — PROVE YOUR FIT
 * Socratic coach entry point. User provides job URL, sees gap analysis, starts interview.
 * 
 * Hard constraints:
 * - DEC-002: No hallucinated experience. Evidence checked against evidence_library only.
 * - DEC-001: All coach logic routes to n8n. This component is UI only.
 * 
 * Data flow:
 * 1. User inputs job URL
 * 2. POST /api/coach/intake — thin receiver forwards to n8n
 * 3. n8n parses job, creates job_scores row, returns webhook
 * 4. Component fetches job_scores (RLS-guarded) and displays gap analysis
 * 5. Evidence readiness checklist queries evidence_library count per category
 */

interface GapItem {
  skill: string;
  userProof: string;
  jobRequired: string;
  status: 'verified' | 'partial' | 'missing';
  evidenceItemId?: string;
}

interface JobAnalysis {
  id: string;
  jobUrl: string;
  jobTitle: string;
  requiredSkills: string[];
  gaps: GapItem[];
  readinessScore: number; // 0-100
  createdAt: string;
}

export function Screen10ProveYourFit() {
  const { supabase, session } = useSupabase();
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [evidenceCount, setEvidenceCount] = useState(0);

  // 1. Fetch user's evidence library count (DEC-002 readiness check)
  const fetchEvidenceCount = async () => {
    if (!session?.user.id) return;
    
    try {
      const { count, error: countError } = await supabase
        .from('evidence_library')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id);
      
      if (countError) throw countError;
      setEvidenceCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch evidence count:', err);
      setEvidenceCount(0);
    }
  };

  // 2. Submit job URL to intake (thin receiver → n8n)
  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!session?.user.id) {
        throw new Error('Not authenticated');
      }

      // DEC-001: Thin receiver only. All logic in n8n.
      const response = await fetch('/api/coach/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          jobUrl,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Coach intake failed: ${response.status} ${errBody}`);
      }

      const { jobScoresId } = await response.json();

      // 3. Poll job_scores table for n8n result (RLS-guarded)
      await fetchJobAnalysis(jobScoresId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch completed analysis from job_scores
  const fetchJobAnalysis = async (jobScoresId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('job_scores')
        .select('*')
        .eq('id', jobScoresId)
        .single();

      if (fetchError) throw fetchError;

      // Parse n8n result from metadata
      const gaps: GapItem[] = (data.analysis_metadata?.gaps || []).map(
        (gap: any) => ({
          skill: gap.skill,
          userProof: gap.userProof || 'No evidence found',
          jobRequired: gap.jobRequired || 'Required',
          status: gap.evidenceFound ? 'verified' : 'missing',
          evidenceItemId: gap.evidenceItemId,
        })
      );

      setAnalysis({
        id: jobScoresId,
        jobUrl,
        jobTitle: data.job_title || 'Job',
        requiredSkills: data.analysis_metadata?.requiredSkills || [],
        gaps,
        readinessScore: data.readiness_score || 0,
        createdAt: data.created_at,
      });

      // Refresh evidence count for UI
      await fetchEvidenceCount();
    } catch (err) {
      console.error('Failed to fetch job analysis:', err);
      throw err;
    }
  };

  // On mount, load evidence count
  React.useEffect(() => {
    fetchEvidenceCount();
  }, [session]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-[Canela] text-5xl text-[#2C2926] mb-4">
            Prove Your Fit
          </h1>
          <p className="text-lg text-[#8E9878]">
            Tell us about the job you're targeting. We'll show you exactly how your verified evidence maps to what they're asking for.
          </p>
        </div>

        {/* Job URL Input Card */}
        <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
          <form onSubmit={handleSubmitJob}>
            <label className="block text-sm font-semibold text-[#2C2926] mb-3">
              Job Posting URL
            </label>
            <div className="flex gap-4 mb-4">
              <Input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://linkedin.com/jobs/..."
                className="flex-1 border-[#D6AAA3]"
                disabled={loading}
                required
              />
              <Button
                type="submit"
                disabled={loading || !jobUrl}
                className="bg-[#8E9878] hover:bg-[#6B7A5E] text-white px-8"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            
            {error && (
              <div className="bg-[#EF4444] bg-opacity-10 border border-[#EF4444] rounded p-4 text-[#EF4444] mb-4">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </form>
        </Card>

        {/* Evidence Readiness Checklist */}
        <Card className="bg-white border border-[#D6AAA3] mb-8 p-8">
          <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-6">
            Your Evidence Readiness
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-4xl font-bold text-[#8E9878]">{evidenceCount}</p>
              <p className="text-sm text-[#2C2926] mt-2">Evidence Items</p>
            </div>
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-4xl font-bold text-[#22C55E]">—</p>
              <p className="text-sm text-[#2C2926] mt-2">Locked Items</p>
            </div>
            <div className="bg-[#F7F2EB] p-4 rounded">
              <p className="text-4xl font-bold text-[#D7BA82]">{analysis?.readinessScore || 0}%</p>
              <p className="text-sm text-[#2C2926] mt-2">Job Fit Score</p>
            </div>
          </div>

          <p className="text-sm text-[#8E9878] mb-4">
            Before we start the interview, make sure you have uploaded evidence for key skills. You can add more anytime.
          </p>
        </Card>

        {/* Gap Analysis (if job analyzed) */}
        {analysis && (
          <Card className="bg-white border border-[#D6AAA3] p-8">
            <h2 className="font-[Canela] text-2xl text-[#2C2926] mb-6">
              Skill Gap Analysis
            </h2>
            
            <div className="space-y-6">
              {analysis.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 p-6 rounded bg-opacity-5 ${
                    gap.status === 'verified'
                      ? 'border-l-[#22C55E] bg-[#22C55E]'
                      : gap.status === 'partial'
                      ? 'border-l-[#EAB308] bg-[#EAB308]'
                      : 'border-l-[#EF4444] bg-[#EF4444]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#2C2926]">{gap.skill}</h3>
                      <p className="text-sm text-[#8E9878] mt-1">
                        They're looking for: {gap.jobRequired}
                      </p>
                    </div>
                    <Badge
                      className={
                        gap.status === 'verified'
                          ? 'bg-[#22C55E] text-white'
                          : gap.status === 'partial'
                          ? 'bg-[#EAB308] text-[#2C2926]'
                          : 'bg-[#EF4444] text-white'
                      }
                    >
                      {gap.status === 'verified'
                        ? '✓ Verified'
                        : gap.status === 'partial'
                        ? '◐ Partial'
                        : '✗ Missing'}
                    </Badge>
                  </div>

                  {gap.evidenceItemId && (
                    <p className="text-sm text-[#2C2926] p-3 bg-white rounded border border-[#D6AAA3]">
                      <strong>Your evidence:</strong> {gap.userProof}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {analysis.gaps.length > 0 && (
              <div className="mt-8 pt-8 border-t border-[#D6AAA3]">
                <Button className="w-full bg-[#8E9878] hover:bg-[#6B7A5E] text-white py-6 text-lg">
                  Start Interview → Prove Your Fit
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default Screen10ProveYourFit;
