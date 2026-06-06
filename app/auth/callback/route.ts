import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_REDIRECT_PREFIXES = [
  '/',
  '/login',
  '/signup',
  '/health',
  '/onboarding',
  '/dashboard',
  '/jobs',
  '/profile',
  '/evidence',
  '/coach',
  '/billing',
  '/settings',
  '/analytics',
  '/documents',
  '/ready-queue',
  '/ready-to-apply',
  '/applications',
  '/integrity',
  '/logs',
]

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path.includes(':') || path.includes('\\')) return false
  return ALLOWED_REDIRECT_PREFIXES.some(prefix =>
    path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?')
  )
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect') || '/'
  const redirect = isValidRedirect(rawRedirect) ? rawRedirect : '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    return NextResponse.redirect(`${origin}${redirect}`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
