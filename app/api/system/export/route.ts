import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const [
    tags, sources, feedItems, feedItemTags, digests, tocEntries, tocEntryArticles,
    digestTags, subjects, subjectFeedItems, notes, webhooksRaw, themes,
    categories, tagCategories, sourceCategories, themeCategories, prompts,
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
    prisma.webhook.findMany({ where: { userId } }),
    prisma.theme.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    prisma.tagCategory.findMany({ where: { tag: { userId } } }),
    prisma.sourceCategory.findMany({ where: { source: { userId } } }),
    prisma.themeCategory.findMany({ where: { theme: { userId } } }),
    prisma.prompt.findMany({ where: { userId }, orderBy: { name: 'asc' }, include: { messages: { orderBy: { order: 'asc' } } } }),
  ])

  const webhooks = webhooksRaw.map(({ secret: _s, ...w }: { secret: string | null; [k: string]: unknown }) => w)

  const counts: Record<string, number> = {
    tags: tags.length, sources: sources.length, feedItems: feedItems.length,
    feedItemTags: feedItemTags.length, digests: digests.length, tocEntries: tocEntries.length,
    tocEntryArticles: tocEntryArticles.length, digestTags: digestTags.length,
    subjects: subjects.length, subjectFeedItems: subjectFeedItems.length,
    notes: notes.length, webhooks: webhooks.length, themes: themes.length,
    categories: categories.length, tagCategories: tagCategories.length,
    sourceCategories: sourceCategories.length, themeCategories: themeCategories.length,
    prompts: prompts.length,
  }

  return new NextResponse(JSON.stringify({
    exportedAt: new Date().toISOString(), version: 1, userId, counts,
    data: {
      tags, sources, feedItems, feedItemTags, digests, tocEntries, tocEntryArticles,
      digestTags, subjects, subjectFeedItems, notes, webhooks, themes,
      categories, tagCategories, sourceCategories, themeCategories, prompts,
    },
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="veille-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
