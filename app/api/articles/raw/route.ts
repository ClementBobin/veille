import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const items = Array.isArray(body) ? body : [body]

  const results = await Promise.allSettled(
    items.map(({ title, url, content, sourceId, publishedAt }) =>
      prisma.feedItem.upsert({
        where: { userId_url: { userId, url } },
        update: {},
        create: {
          title,
          url,
          content,
          sourceId,
          userId,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        },
      })
    )
  )

  const sourceIds = [...new Set(items.map((i) => i.sourceId).filter(Boolean))]
  if (sourceIds.length) {
    await prisma.source.updateMany({ where: { id: { in: sourceIds }, userId }, data: { lastFetch: new Date() } })
  }

  const created = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ created, total: items.length }, { status: 201 })
})

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const unprocessed = searchParams.get('unprocessed') === 'true'

  const count = await prisma.feedItem.count({ where: { userId } })
  console.log('count for userId:', userId, '→', count)

  const items = await prisma.feedItem.findMany({
    where: {
      userId,
      ...(unprocessed
        ? { OR: [{ processed: false }, { source: { active: false, cache: true } }] }
        : {}),
    },
    include: { source: true, tags: { include: { tag: true } } },
    orderBy: { fetchedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(items)
})