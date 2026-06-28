import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

const include = {
  categories: { include: { category: { select: { id: true, name: true, color: true } } } },
}

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params
  const tag = await prisma.tag.findFirst({ where: { id, userId }, include })
  if (!tag) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tag)
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.tag.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, color, description, active, categoryIds } = body

  if (name !== undefined && name !== existing.name) {
    const dup = await prisma.tag.findFirst({
      where: { userId, name: { equals: name, mode: 'insensitive' }, id: { not: id } },
    })
    if (dup) return NextResponse.json({ error: 'A tag with this name already exists' }, { status: 409 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (color !== undefined) data.color = color
  if (description !== undefined) data.description = description
  if (active !== undefined) data.active = active

  await prisma.$transaction(async tx => {
    await tx.tag.update({ where: { id }, data })
    if (categoryIds !== undefined) {
      await tx.tagCategory.deleteMany({ where: { tagId: id } })
      if (categoryIds.length) {
        await tx.tagCategory.createMany({
          data: (categoryIds as string[]).map(categoryId => ({ tagId: id, categoryId })),
        })
      }
    }
  })

  const tag = await prisma.tag.findFirst({ where: { id }, include })
  return NextResponse.json(tag)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params
  const existing = await prisma.tag.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})