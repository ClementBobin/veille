import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// N8N WF1 — store raw articles
export async function POST(req: NextRequest) {
  const body = await req.json()
  const articles = Array.isArray(body) ? body : [body]

  const results = await Promise.allSettled(
    articles.map(({ title, url, content, sourceId, publishedAt }) =>
      prisma.article.upsert({
        where: { url },
        update: {},
        create: {
          title,
          url,
          content,
          sourceId,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        },
      })
    )
  )

  const created = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ created, total: articles.length }, { status: 201 })
}

// N8N WF2 — read unprocessed articles
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unprocessed = searchParams.get('unprocessed') === 'true'

  const articles = await prisma.article.findMany({
    where: unprocessed ? { processed: false } : undefined,
    include: { source: true, tags: { include: { tag: true } } },
    orderBy: { fetchedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(articles)
}