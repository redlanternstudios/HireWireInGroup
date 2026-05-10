import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Supabase configuration helper - validates environment variables
const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add Supabase integration via the Settings menu.'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add Supabase integration via the Settings menu.'
    )
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey }
}

// Regular client for authenticated user operations
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

// Admin client that bypasses RLS - use for server-side operations ONLY.
// Must never be available in Preview or Development environments.
// Restrict SUPABASE_SERVICE_ROLE_KEY to Production in Vercel env var settings.
export function createAdminClient() {
  const config = getSupabaseConfig()

  if (!config.supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'This key must only be configured for the Production environment.'
    )
  }

  // Hard block: refuse to create an admin client in non-production Vercel deployments.
  // VERCEL_ENV is set by Vercel automatically: "production" | "preview" | "development"
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv && vercelEnv !== 'production') {
    throw new Error(
      `createAdminClient() called in Vercel "${vercelEnv}" environment. ` +
      'The service role key must not be used outside Production.'
    )
  }

  return createSupabaseClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
