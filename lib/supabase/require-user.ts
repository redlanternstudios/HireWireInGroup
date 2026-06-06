import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

interface AuthSuccess {
  ok: true
  supabase: SupabaseClient
  userId: string
  user: User
}

interface AuthFailure {
  ok: false
  response: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure

export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      ),
    }
  }

  return {
    ok: true,
    supabase,
    userId: user.id,
    user,
  }
}
