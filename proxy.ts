import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/register']

// When set, the web dashboard (UI + auth pages) is disabled and only
// the JSON API under /api/* is served. Useful for headless/API-only
// deployments that authenticate purely via Bearer API keys.
const API_ONLY = process.env.API_ONLY === 'true' || process.env.DISABLE_WEB_UI === 'true'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always let Next.js internals and static assets through.
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  if (API_ONLY) {
    // Only the API surface is reachable; everything else returns 404.
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    return NextResponse.json(
      { error: 'Web UI disabled — this instance is running in API-only mode.' },
      { status: 404 },
    )
  }

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  const session = req.cookies.get('session')?.value
  const payload = session ? await verifySessionToken(session) : null

  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}