import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

const EXPECTED_PROJECT_REF = 'endovljmaudnxdzdapmf'

function cleanEnvValue(value: string | undefined) {
  return value?.replace(/[\u2028\u2029]/g, '').trim()
}

function getBrowserSupabaseConfig() {
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  let projectRef: string

  try {
    projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
  }

  if (projectRef !== EXPECTED_PROJECT_REF) {
    throw new Error(
      `Supabase project mismatch: expected ${EXPECTED_PROJECT_REF}, received ${projectRef}`,
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getBrowserSupabaseConfig()
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function useSupabase() {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { supabase, session, loading }
}
