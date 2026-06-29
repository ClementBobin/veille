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
  const theme = await prisma.theme.findFirst({ where: { id, userId }, include })
  if (!theme) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(theme)
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.theme.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.description !== undefined) data.description = body.description
  if (body.tags !== undefined) data.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags
  if (body.active !== undefined) data.active = body.active
  if (body.validationCriteria !== undefined) data.validationCriteria = body.validationCriteria

  await prisma.$transaction(async tx => {
    await tx.theme.update({ where: { id }, data })
    if (body.categoryIds !== undefined) {
      await tx.themeCategory.deleteMany({ where: { themeId: id } })
      if (body.categoryIds.length) {
        await tx.themeCategory.createMany({
          data: (body.categoryIds as string[]).map(categoryId => ({ themeId: id, categoryId })),
        })
      }
    }
  })

  const theme = await prisma.theme.findFirst({ where: { id }, include })
  dispatchWebhook(userId, 'theme.updated', theme).catch(() => {})
  return NextResponse.json(theme)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.theme.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.theme.delete({ where: { id } })
  dispatchWebhook(userId, 'theme.deleted', { id }).catch(() => {})
  return NextResponse.json({ ok: true })
})
