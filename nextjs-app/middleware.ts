import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /rooms routes - require authentication
  if (req.nextUrl.pathname.startsWith('/rooms')) {
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect to rooms if already logged in and trying to access login
  if (req.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/rooms', req.url))
  }

  return res
}

export const config = {
  matcher: ['/rooms/:path*', '/login'],
}
