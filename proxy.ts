import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/register']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next')
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