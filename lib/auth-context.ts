import { NextRequest, NextResponse } from 'next/server'
import { hashKey } from './auth'
import { verifySessionToken } from './session'
import { prisma } from './prisma'

export async function getAuth(req: NextRequest): Promise<{ userId: string, keyName: string } | NextResponse> {
  // 1. Session cookie (web UI)
  const session = req.cookies.get('session')?.value
  if (session) {
    const payload = await verifySessionToken(session)
    if (payload) return { userId: payload.userId, keyName: "user" }
  }

  // 2. Bearer API key (n8n / programmatic) — scoped to its owner
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const hash = hashKey(token)
    const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } })
    if (key) {
      prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } }).catch(() => {})
      return { userId: key.userId, keyName: key.name }
    }
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}