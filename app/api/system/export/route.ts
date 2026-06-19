import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const [
    tags,
    sources,
    feedItems,
    feedItemTags,
    digests,
    tocEntries,
    tocEntryArticles,
    digestTags,
    subjects,
    subjectFeedItems,
    notes,
  ] = await Promise.all([
    prisma.tag.findMany({ where: { userId } }),
    prisma.source.findMany({ where: { userId } }),
    prisma.feedItem.findMany({ where: { userId } }),
    prisma.feedItemTag.findMany({ where: { feedItem: { userId } } }),
    prisma.digest.findMany({ where: { userId } }),
    prisma.tocEntry.findMany({ where: { digest: { userId } } }),
    prisma.tocEntryArticle.findMany({ where: { tocEntry: { digest: { userId } } } }),
    prisma.digestTag.findMany({ where: { digest: { userId } } }),
    prisma.subject.findMany({ where: { digest: { userId } } }),
    prisma.subjectFeedItem.findMany({ where: { subject: { digest: { userId } } } }),
    prisma.note.findMany({ where: { userId } }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    userId,
    data: {
      tags,
      sources,
      feedItems,
      feedItemTags,
      digests,
      tocEntries,
      tocEntryArticles,
      digestTags,
      subjects,
      subjectFeedItems,
      notes,
    },
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="veille-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}