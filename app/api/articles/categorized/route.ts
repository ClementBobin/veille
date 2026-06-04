import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// N8N WF2 stores categorization result
export async function POST(req: NextRequest) {
  const { articleId, tags, score, relevant } = await req.json()

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      relevant,
      score,
      processed: true,
      tags: relevant
        ? {
            createMany: {
              data: tags.map((tagId: string) => ({ tagId })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
  })
  return NextResponse.json(article)
}

// N8N WF3 reads categorized + relevant articles not yet in a digest
export async function GET() {
  const articles = await prisma.article.findMany({
    where: { relevant: true, processed: true, subjects: { none: {} } },
    include: { tags: { include: { tag: true } }, source: true },
    orderBy: { fetchedAt: 'desc' },
  })
  return NextResponse.json(articles)
}