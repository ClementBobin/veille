import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { title, summary, toc } = await req.json()
  const allArticleIds = [...new Set((toc || []).flatMap((s: any) => s.articleIds || []))]

  const tagIds = await prisma.feedItemTag.findMany({
    where: { feedItemId: { in: allArticleIds }, feedItem: { userId } },
    select: { tagId: true },
  }).then(rows => [...new Set(rows.map(r => r.tagId))])

  const digest = await prisma.digest.create({
    data: {
      title, summary, userId,
      tags: tagIds.length ? { createMany: { data: tagIds.map(id => ({ tagId: id })) } } : undefined,
      subjects: {
        create: (toc || []).map((s: any, i: number) => ({
          title: s.title, summary: s.summary, order: i,
          feedItems: s.articleIds?.length
            ? { create: s.articleIds.map((feedItemId: string) => ({ feedItemId })) }
            : undefined,
        })),
      },
      toc: {
        create: (toc || []).map((s: any, i: number) => ({
          title: s.title, summary: s.summary, order: i,
          articles: s.articleIds?.length
            ? { create: s.articleIds.map((feedItemId: string) => ({ feedItemId })) }
            : undefined,
        })),
      },
    },
    include: {
      subjects: { include: { feedItems: { include: { feedItem: true } } } },
      toc: { orderBy: { order: 'asc' }, include: { articles: { include: { feedItem: { include: { source: true } } } } } },
      tags: { include: { tag: true } },
    },
  })

  dispatchWebhook(userId, 'digest.created', { id: digest.id, title: digest.title, status: digest.status }).catch(() => {})
  return NextResponse.json(digest, { status: 201 })
})

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const digests = await prisma.digest.findMany({
    where: { userId, ...(status ? { status: status as any } : {}) },
    include: {
      subjects: { include: { feedItems: { include: { feedItem: { include: { source: true } } } } }, orderBy: { order: 'asc' } },
      toc: { orderBy: { order: 'asc' }, include: { articles: { include: { feedItem: { include: { source: true } } } } } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: status === 'PENDING' ? 1 : 20,
  })

  return NextResponse.json(digests)
})
