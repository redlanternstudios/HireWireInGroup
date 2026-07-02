import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function cleanEnvValue(value: string | undefined) {
  return value?.replace(/[\u2028\u2029]/g, '').trim()
}

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/health',
  '/auth/callback',
  '/auth/error',
  '/landing',
  '/terms',
  '/privacy',
  '/waitlist',
  '/test-fixtures',
]

const AUTH_ROUTES = [
  '/login',
  '/signup',
]

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Constitution §4.4: no non-null assertion may hide an absent env value.
  // In middleware, a missing key means auth-gating is impossible — log loudly
  // and return the default response rather than throwing (which would crash all routing).
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[HireWire middleware] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Auth-gating is disabled until environment is configured correctly.'
    )
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isApiRoute = pathname.startsWith('/api')
  if (isApiRoute) {
    return response
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    // Honor ?redirect= param if present, otherwise send to dashboard
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    url.pathname = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    // Root path unauthenticated users → landing page
    if (pathname === '/') {
      url.pathname = '/landing'
      url.search = ''
      return NextResponse.redirect(url)
    }
    // All other protected routes → login with redirect back
    const redirectTo = encodeURIComponent(pathname + request.nextUrl.search)
    url.pathname = '/login'
    url.search = `?redirect=${redirectTo}`
    return NextResponse.redirect(url)
  }

  return response
}
