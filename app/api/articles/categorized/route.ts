import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { getAuth } from '@/lib/auth-context'

function hashTags(tags: string[]): string {
  return createHash('md5').update([...tags].sort().join('|')).digest('hex')
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const feedItemId = body.feedItemId ?? body.articleId ?? body.id
  const { tags = [], score = 0, relevant = false } = body
  const newHash = hashTags(tags)

  const existing = await prisma.feedItem.findFirst({
    where: { id: feedItemId, userId },
    select: { tagsHash: true, processed: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing.tagsHash === newHash && existing.processed) {
    return NextResponse.json({ skipped: true, reason: 'tags_unchanged' })
  }

  let tagIds: string[] = []
  if (relevant && tags.length) {
    const found = await prisma.tag.findMany({ where: { name: { in: tags }, userId }, select: { id: true } })
    tagIds = found.map((t) => t.id)
  }

  const updated = await prisma.feedItem.update({
    where: { id: feedItemId },
    data: {
      relevant,
      score,
      processed: true,
      tagsHash: newHash,
      tags: {
        deleteMany: {},
        ...(tagIds.length ? { createMany: { data: tagIds.map((tagId) => ({ tagId })) } } : {}),
      },
    },
  })

  return NextResponse.json(updated)
}

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const resumeFrom = searchParams.get('resumeFrom')

  const items = await prisma.feedItem.findMany({
    where: {
      userId,
      relevant: true,
      processed: true,
      subjects: { none: {} },
      ...(resumeFrom ? { id: { gt: resumeFrom } } : {}),
    },
    include: { tags: { include: { tag: true } }, source: true },
    orderBy: { fetchedAt: 'desc' },
  })
  return NextResponse.json(items)
}