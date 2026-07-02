import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Browser client — session is persisted in COOKIES (via @supabase/ssr) so that
// Next.js middleware (proxy.ts) and server components, which read the session
// through createServerClient, can actually see the logged-in user.
// NOTE: the plain @supabase/supabase-js client stores the session in localStorage
// only, which the server never sees → login "succeeds" then silently bounces back
// to /login. That was the auth bug. createBrowserClient fixes it.
// ANON_KEY is safe to expose on the client; SERVICE_ROLE_KEY is server-only.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Shared singleton for the hooks/helpers below.
const supabase = createClient();

// Client-side hook: returns the browser Supabase client plus the current auth
// session, kept live via onAuthStateChange. Client components use this to run
// RLS-guarded queries scoped to the signed-in user (session.user.id).
export function useSupabase() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  return { supabase, session };
}

// DEC-002: Evidence gating helper (not a React hook).
// Before any resume claim is shown, verify evidence source.
export async function evidenceGate() {
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
