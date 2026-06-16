import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect dashboard pages (not /login or /api/auth/*)
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api/auth')
  if (isPublic) return NextResponse.next()

  // API routes are protected by verifyApiKey — skip here
  if (pathname.startsWith('/api')) return NextResponse.next()

  const session = req.cookies.get('session')?.value
  if (session !== process.env.SESSION_SECRET) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}