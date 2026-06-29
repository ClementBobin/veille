import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

const countInclude = { _count: { select: { tagLinks: true, sourceLinks: true, themeLinks: true } } }

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params
  const category = await prisma.category.findFirst({ where: { id, userId }, include: countInclude })
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(category)
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.category.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, description, color } = await req.json()

  if (name !== undefined && name.trim() !== existing.name) {
    const dup = await prisma.category.findFirst({
      where: { userId, name: { equals: name.trim(), mode: 'insensitive' }, id: { not: id } },
    })
    if (dup) return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name.trim()
  if (description !== undefined) data.description = description
  if (color !== undefined) data.color = color

  const category = await prisma.category.update({ where: { id }, data, include: countInclude })
  dispatchWebhook(userId, 'category.updated', category).catch(() => {})
  return NextResponse.json(category)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.category.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.category.delete({ where: { id } })
  dispatchWebhook(userId, 'category.deleted', { id }).catch(() => {})
  return NextResponse.json({ ok: true })
})
