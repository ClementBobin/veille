import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { verifySessionToken } from './session'
import { hashKey } from './auth'

type AnyHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse | Response>

export function withLog<T extends AnyHandler>(handler: T): T {
  return (async (req: NextRequest, ctx?: any) => {
    const start = Date.now()
    let userId: string | null = null
    let authType: string | null = null
    let apiKeyName: string | null = null
    let status = 500
    let error: string | null = null

    try {
      const session = req.cookies.get('session')?.value
      const authHeader = req.headers.get('authorization') ?? ''

      if (session) {
        const payload = await verifySessionToken(session)
        if (payload) { userId = payload.userId; authType = 'session' }
      } else if (authHeader.startsWith('Bearer ')) {
        const hash = hashKey(authHeader.slice(7))
        const key = await prisma.apiKey.findUnique({
          where: { keyHash: hash },
          select: { userId: true, name: true },
        })
        if (key) { userId = key.userId; authType = 'apikey'; apiKeyName = key.name }
      }
    } catch {}

    let res: NextResponse | Response
    try {
      res = await handler(req, ctx)
      status = res.status
    } catch (err: any) {
      error = err?.message ?? 'Unknown error'
      res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    prisma.log.create({
      data: {
        userId,
        method: req.method,
        path: new URL(req.url).pathname,
        status,
        durationMs: Date.now() - start,
        authType,
        apiKeyName,
        error,
        type: 'request',
      },
    }).catch(() => {})

    return res
  }) as T
}