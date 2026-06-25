import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { normalizeEvents } from '@/lib/webhook-events'

const SELECT = {
  id: true, name: true, url: true, events: true, active: true,
  lastTriggeredAt: true, lastStatus: true, createdAt: true,
} as const

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.webhook.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, url, secret, events, active } = body

  if (name !== undefined && name !== existing.name) {
    const dup = await prisma.webhook.findFirst({
      where: { userId, name: { equals: name, mode: 'insensitive' }, id: { not: id } },
    })
    if (dup) return NextResponse.json({ error: 'A webhook with this name already exists' }, { status: 409 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (url !== undefined) data.url = url
  if (secret !== undefined) data.secret = secret || null
  if (events !== undefined) data.events = normalizeEvents(events)
  if (active !== undefined) data.active = active

  const webhook = await prisma.webhook.update({ where: { id }, data, select: SELECT })
  return NextResponse.json(webhook)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.webhook.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.webhook.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})