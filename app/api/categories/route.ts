import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))
  const paginate = searchParams.has('page') || searchParams.has('limit')

  const where = {
    userId,
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  if (!paginate) {
    // Return all for pickers / dropdowns
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { tagLinks: true, sourceLinks: true, themeLinks: true } } },
    })
    return NextResponse.json(categories)
  }

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { tagLinks: true, sourceLinks: true, themeLinks: true } } },
    }),
  ])

  return NextResponse.json({ categories, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit })
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { name, description, color } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const existing = await prisma.category.findFirst({
    where: { userId, name: { equals: name.trim(), mode: 'insensitive' } },
  })
  if (existing) return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 })

  const category = await prisma.category.create({
    data: { userId, name: name.trim(), description: description ?? null, color: color ?? '#a78bfa' },
    include: { _count: { select: { tagLinks: true, sourceLinks: true, themeLinks: true } } },
  })

  return NextResponse.json(category, { status: 201 })
})