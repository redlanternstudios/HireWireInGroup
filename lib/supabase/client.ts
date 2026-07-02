import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';

// Browser-only: ANON_KEY is safe to expose on client.
// SERVICE_ROLE_KEY is NEVER used here — server-only (API routes only).
// Constitution §4.4: no non-null assertion may hide an absent env value.
function getBrowserSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '[HireWire] Missing NEXT_PUBLIC_SUPABASE_URL — add Supabase integration in project settings.'
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      '[HireWire] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — add Supabase integration in project settings.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = getBrowserSupabaseConfig();

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
// DEC-002: Evidence gating hook
// Before any resume claim is shown, verify evidence source
export function useSupabase() {
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

// Named factory for components that need a fresh client reference.
export function createClient() {
  return supabase;
}

// Synchronous React hook — returns the singleton supabase client and the live session.
// Screens destructure: const { supabase, session } = useSupabase();
export function useSupabase() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { supabase, session };
}
