import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const forN8n = searchParams.get('for_n8n') === 'true'

  const sources = await prisma.source.findMany({
    where: { userId, active: true },
    orderBy: { name: 'asc' },
    include: forN8n ? { feedItems: { take: 1, select: { id: true } } } : undefined,
  })

  if (!forN8n) return NextResponse.json(sources)

  const filtered = sources.filter((s: any) => (!s.cache ? true : s.feedItems.length === 0))
  return NextResponse.json(filtered.map(({ feedItems: _fi, ...s }: any) => s))
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { name, url, type, cache } = body
  if (!name || !url || !type)
    return NextResponse.json({ error: 'name, url, type required' }, { status: 400 })

  const source = await prisma.source.create({ data: { name, url, type, cache: cache ?? false, userId } })
  return NextResponse.json(source, { status: 201 })
}