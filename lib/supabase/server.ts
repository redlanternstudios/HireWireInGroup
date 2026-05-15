import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function cleanEnvValue(value: string | undefined) {
  return value?.replace(/[\u2028\u2029]/g, '').trim()
}

// Supabase configuration helper - validates environment variables
const getSupabaseConfig = () => {
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  // Accept SUPABASE_SECRET_KEY as alias (Supabase integration stores it under that name)
  const supabaseServiceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)

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
      'Admin client requires this key. In production, restrict this key to server-side only. ' +
      'In development/preview, you may set it locally for testing admin operations.'
    )
  }

  // createAdminClient is allowed in dev/preview if SUPABASE_SERVICE_ROLE_KEY is set
  // Ensure this key is never exposed to the browser or client bundles

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
