import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

/**
 * Supabase client for browser-side use
 * 
 * Hard constraint (SEC-001):
 * - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are browser-safe
 * - NO service role key in browser. Service role key is server-only (app/api/* routes).
 * - RLS policies on Supabase tables enforce user isolation at DB level
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hook: useSupabase
 * Returns authenticated Supabase client + current session
 * All queries automatically respect RLS policies for logged-in user
 */
export function useSupabase() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    supabase,
    session,
    loading,
  };
}
