import { createClient } from '@supabase/supabase-js';

// Browser-only: ANON_KEY is safe to expose on client
// SERVICE_ROLE_KEY is NEVER used in browser — server-only (API routes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DEC-002: Evidence gating hook
// Before any resume claim is shown, verify evidence source
export async function useSupabase() {
  return {
    // Get all evidence for current user (RLS handles user_id filtering)
    getEvidence: async () => {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Evidence fetch failed: ${error.message}`);
      return data;
    },

    // Get evidence by ID (with RLS check)
    getEvidenceById: async (id: string) => {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(`Evidence not found: ${error.message}`);
      return data;
    },

    // Hard gate: claim must have source evidence
    validateClaimHasSource: async (claimId: string) => {
      const { data, error } = await supabase
        .from('claim_evidence_map')
        .select('evidence_id')
        .eq('claim_id', claimId);
      
      if (error || !data || data.length === 0) {
        throw new Error('DEC-002 VIOLATION: Claim has no source evidence');
      }
      return data;
    },

    // Get governance view (resume + evidence map)
    getGovernanceView: async (userId: string) => {
      const { data: claims, error: claimsError } = await supabase
        .from('resume_claims')
        .select('*')
        .eq('user_id', userId);

      if (claimsError) throw new Error(`Claims fetch failed: ${claimsError.message}`);

      // For each claim, verify evidence exists
      const withEvidence = await Promise.all(
        claims.map(async (claim) => {
          const sources = await supabase
            .from('claim_evidence_map')
            .select('evidence_id')
            .eq('claim_id', claim.id);
          return {
            ...claim,
            hasSources: sources.data && sources.data.length > 0,
          };
        })
      );

      return withEvidence;
    },
  };
}
