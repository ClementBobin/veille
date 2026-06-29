import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { normalizeScopes } from '@/lib/webhook-events'

const SELECT = {
  id: true, name: true, url: true, events: true, active: true,
  lastTriggeredAt: true, lastStatus: true, createdAt: true,
} as const

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const webhooks = await prisma.webhook.findMany({
    where: { userId },
    select: SELECT,
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(webhooks)
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { name, url, secret, scopes } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  const dup = await prisma.webhook.findFirst({
    where: { userId, name: { equals: name.trim(), mode: 'insensitive' } },
  })
  if (dup) return NextResponse.json({ error: 'A webhook with this name already exists' }, { status: 409 })

  const webhook = await prisma.webhook.create({
    data: {
      userId,
      name: name.trim(),
      url: url.trim(),
      secret: secret || null,
      events: normalizeScopes(scopes),
      active: true,
    },
    select: SELECT,
  })

  return NextResponse.json(webhook, { status: 201 })
})
