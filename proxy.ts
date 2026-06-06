import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static JS/CSS chunks)
     * - _next/image   (image optimization)
     * - _next/data    (RSC prefetch payloads — MUST be excluded or they loop on /login)
     * - favicon.ico
     * - brand/        (public static assets — logo, icons)
     * - image files   (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|_next/data|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
