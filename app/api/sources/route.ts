import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@/prisma/generated/client/client'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

const include = {
  categories: { include: { category: { select: { id: true, name: true, color: true } } } },
}

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const forN8n = searchParams.get('for_n8n') === 'true'
  const search = searchParams.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(200, parseInt(searchParams.get('limit') ?? '50', 10))
  const paginate = searchParams.has('page') || searchParams.has('limit')
  const categoryIds = searchParams.getAll('categoryId').filter(Boolean)

  if (forN8n) {
    const sources = await prisma.source.findMany({
      where: { userId, active: true },
      orderBy: { name: 'asc' },
      include: { feedItems: { take: 1, select: { id: true } } },
    })
    const filtered = sources.filter((s: any) => (!s.cache ? true : s.feedItems.length === 0))
    return NextResponse.json(filtered.map(({ feedItems: _fi, ...s }: any) => s))
  }

  const where: Prisma.SourceWhereInput = { userId }
  if (search) where.name = { contains: search, mode: 'insensitive' as const }
  if (categoryIds.length > 0) {
    where.categories = { some: { categoryId: { in: categoryIds } } }
  }

  if (!paginate) {
    const sources = await prisma.source.findMany({ where, orderBy: { name: 'asc' }, include })
    return NextResponse.json(sources)
  }

  const [total, sources] = await Promise.all([
    prisma.source.count({ where }),
    prisma.source.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit, include }),
  ])

  return NextResponse.json({ sources, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit })
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { name, url, type, cache, categoryIds } = body
  if (!name || !url || !type)
    return NextResponse.json({ error: 'name, url, type required' }, { status: 400 })

  const existing = await prisma.source.findFirst({ where: { userId, url } })
  if (existing) return NextResponse.json({ error: 'A source with this URL already exists' }, { status: 409 })

  const source = await prisma.source.create({
    data: {
      name, url, type, cache: cache ?? false, userId,
      ...(categoryIds?.length
        ? { categories: { create: (categoryIds as string[]).map(categoryId => ({ categoryId })) } }
        : {}),
    },
    include,
  })

  dispatchWebhook(userId, 'source.created', source).catch(() => {})
  return NextResponse.json(source, { status: 201 })
})
