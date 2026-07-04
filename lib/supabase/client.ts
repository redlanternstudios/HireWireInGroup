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

// Lazy singleton pattern to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const { supabaseUrl, supabaseAnonKey } = getBrowserSupabaseConfig();
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get: (target, prop) => {
    return getSupabaseClient()[prop as keyof typeof supabaseInstance];
  },
});

// Named factory for components that need the singleton client reference.
export function createClient() {
  return getSupabaseClient();
}

// React hook — returns the singleton supabase client and the live session.
// Screens destructure: const { supabase, session } = useSupabase();
export function useSupabase() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { supabase: getSupabaseClient(), session };
}
