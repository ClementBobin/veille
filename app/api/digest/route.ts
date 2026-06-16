import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'

// n8n WF3 — create digest with condensed subjects
export async function POST(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const { title, summary, toc } = await req.json()

  // Collect all unique articleIds across all toc entries
  const allArticleIds = [...new Set(
    (toc || []).flatMap((s: any) => s.articleIds || [])
  )]

  // Get tagIds from the FeedItems referenced by those articleIds
  const tagIds = await prisma.feedItemTag.findMany({
    where: { feedItemId: { in: allArticleIds } },
    select: { tagId: true },
  }).then(rows => [...new Set(rows.map(r => r.tagId))])

  const digest = await prisma.digest.create({
    data: {
      title,
      summary,
      tags: tagIds.length
        ? { createMany: { data: tagIds.map((id) => ({ tagId: id })) } }
        : undefined,
      subjects: {
        create: (toc || []).map(
          (s: { title: string; summary: string; articleIds?: string[] }, i: number) => ({
            title: s.title,
            summary: s.summary,
            order: i,
            feedItems: s.articleIds?.length
              ? { create: s.articleIds.map((feedItemId: string) => ({ feedItemId })) }
              : undefined,
          })
        ),
      },
      toc: {
        create: (toc || []).map(
          (s: { title: string; summary: string; articleIds?: string[] }, i: number) => ({
            title: s.title,
            summary: s.summary,
            order: i,
            articles: s.articleIds?.length
              ? { create: s.articleIds.map((feedItemId: string) => ({ feedItemId })) }
              : undefined,
          })
        ),
      },
    },
    include: {
      subjects: {
        include: { feedItems: { include: { feedItem: true } } },
      },
      toc: {
        orderBy: { order: 'asc' },
        include: {
          articles: { include: { feedItem: { include: { source: true } } } },
        },
      },
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(digest, { status: 201 })
}



// WF4 (Next.js) + Web UI — read digests
export async function GET(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const digests = await prisma.digest.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      subjects: {
        include: {
          feedItems: { include: { feedItem: { include: { source: true } } } },
        },
        orderBy: { order: 'asc' },
      },
      toc: {
        orderBy: { order: 'asc' },
        include: {
          articles: { include: { feedItem: { include: { source: true } } } },
        },
      },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: status === 'PENDING' ? 1 : 20,
  })

  return NextResponse.json(digests)
}