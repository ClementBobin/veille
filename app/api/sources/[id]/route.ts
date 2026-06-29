import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

const include = {
  categories: { include: { category: { select: { id: true, name: true, color: true } } } },
}

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params
  const source = await prisma.source.findFirst({ where: { id, userId }, include })
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(source)
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.source.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, url, type, active, cache, categoryIds } = body

  if (url !== undefined && url !== existing.url) {
    const dup = await prisma.source.findFirst({ where: { userId, url, id: { not: id } } })
    if (dup) return NextResponse.json({ error: 'A source with this URL already exists' }, { status: 409 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (url !== undefined) data.url = url
  if (type !== undefined) data.type = type
  if (active !== undefined) data.active = active
  if (cache !== undefined) data.cache = cache

  await prisma.$transaction(async tx => {
    await tx.source.update({ where: { id }, data })
    if (categoryIds !== undefined) {
      await tx.sourceCategory.deleteMany({ where: { sourceId: id } })
      if (categoryIds.length) {
        await tx.sourceCategory.createMany({
          data: (categoryIds as string[]).map(categoryId => ({ sourceId: id, categoryId })),
        })
      }
    }
  })

  const source = await prisma.source.findFirst({ where: { id }, include })
  dispatchWebhook(userId, 'source.updated', source).catch(() => {})
  return NextResponse.json(source)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.source.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.source.delete({ where: { id } })
  dispatchWebhook(userId, 'source.deleted', { id }).catch(() => {})
  return NextResponse.json({ ok: true })
})
