import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params

  const webhook = await prisma.webhook.findFirst({ where: { id, userId } })
  if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))

  let logs: Array<{
    id: string
    path: string
    status: int
    durationMs: number
    error: string | null
    createdAt: Date
  }> = []
  let dbAvailable = true

  try {
    // Webhook delivery logs are stored as Log entries with type='webhook' and path encoding the webhook id
    logs = await prisma.log.findMany({
      where: {
        userId,
        type: 'webhook',
        path: { contains: id },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        path: true,
        status: true,
        durationMs: true,
        error: true,
        createdAt: true,
      },
    })
  } catch {
    dbAvailable = false
  }

  // Parse the encoded info out of the path field: /webhook/{webhookId}/{event}?test=1
  const parsed = logs.map(l => {
    const parts = l.path.replace('/webhook/', '').split('/')
    const event = parts[1] ?? 'unknown'
    const isTest = l.path.includes('?test=1')
    return {
      id: l.id,
      event,
      ok: l.status >= 200 && l.status < 300,
      status: l.status,
      error: l.error,
      isTest,
      durationMs: l.durationMs,
      createdAt: l.createdAt,
    }
  })

  return NextResponse.json({ logs: parsed, dbAvailable })
})
