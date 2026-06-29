import { NextRequest, NextResponse } from 'next/server'
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
  const search = searchParams.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(200, parseInt(searchParams.get('limit') ?? '50', 10))
  const paginate = searchParams.has('page') || searchParams.has('limit')

  const where = {
    userId,
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  if (!paginate) {
    const themes = await prisma.theme.findMany({ where, orderBy: { createdAt: 'desc' }, include })
    return NextResponse.json(themes)
  }

  const [total, themes] = await Promise.all([
    prisma.theme.count({ where }),
    prisma.theme.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include }),
  ])

  return NextResponse.json({ themes, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit })
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { title, description, tags, active, validationCriteria, categoryIds } = body
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const theme = await prisma.theme.create({
    data: {
      userId,
      title: title.trim(),
      description: description ?? null,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags ?? '[]'),
      active: active ?? true,
      validationCriteria: validationCriteria ?? null,
      ...(categoryIds?.length
        ? { categories: { create: (categoryIds as string[]).map(categoryId => ({ categoryId })) } }
        : {}),
    },
    include,
  })

  dispatchWebhook(userId, 'theme.created', theme).catch(() => {})
  return NextResponse.json(theme, { status: 201 })
})
