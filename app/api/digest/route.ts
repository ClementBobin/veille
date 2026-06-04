import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// N8N WF3 creates the digest with condensed subjects
export async function POST(req: NextRequest) {
  const { subjects, tagIds } = await req.json()
  // subjects: [{title, summary, articles: [url]}]

  const digest = await prisma.digest.create({
    data: {
      tags: tagIds?.length
        ? { createMany: { data: tagIds.map((id: string) => ({ tagId: id })) } }
        : undefined,
      subjects: {
        create: subjects.map((s: { title: string; summary: string; articles: string[] }, i: number) => ({
          title: s.title,
          summary: s.summary,
          order: i,
          articles: {
            create: s.articles.map((url: string) => ({
              article: { connect: { url } },
            })),
          },
        })),
      },
    },
    include: { subjects: true, tags: { include: { tag: true } } },
  })
  return NextResponse.json(digest, { status: 201 })
}

// WF4 reads latest pending digest + site UI
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // PENDING | SENT | SELECTED | DONE

  const digests = await prisma.digest.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      subjects: { include: { articles: { include: { article: { include: { source: true } } } } } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: status === 'PENDING' ? 1 : 20,
  })
  return NextResponse.json(digests)
}