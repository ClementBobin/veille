import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// N8N WF2 — store categorization result
export async function POST(req: NextRequest) {
  const body = await req.json()
  const articleId = body.articleId ?? body.id
  const { tags, score, relevant } = body

  let tagIds: string[] = []
  if (relevant && tags?.length) {
    const found = await prisma.tag.findMany({
      where: { name: { in: tags } },
      select: { id: true },
    })
    tagIds = found.map((t) => t.id)
  }

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      relevant,
      score,
      processed: true,
      tags: tagIds.length
        ? {
            upsert: tagIds.map((tagId) => ({
              where: { articleId_tagId: { articleId, tagId } },
              create: { tagId },
              update: {},
            })),
          }
        : undefined,
    },
  })

  return NextResponse.json(article)
}

// N8N WF3 — read categorized relevant articles not yet in a digest
export async function GET() {
  const articles = await prisma.article.findMany({
    where: { relevant: true, processed: true, subjects: { none: {} } },
    include: { tags: { include: { tag: true } }, source: true },
    orderBy: { fetchedAt: 'desc' },
  })
  return NextResponse.json(articles)
}