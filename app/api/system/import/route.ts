import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

export async function POST(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.version !== 1 || !payload.data) {
    return NextResponse.json({ error: 'Unrecognized export format' }, { status: 400 })
  }

  const {
    tags = [],
    sources = [],
    feedItems = [],
    feedItemTags = [],
    digests = [],
    tocEntries = [],
    tocEntryArticles = [],
    digestTags = [],
    subjects = [],
    subjectFeedItems = [],
    notes = [],
  } = payload.data

  // Strip timestamps + userId from records so we re-own them cleanly
  function own<T extends Record<string, any>>(record: T): T {
    const { createdAt, updatedAt, ...rest } = record
    return { ...rest, userId } as T
  }

  function ownChild<T extends Record<string, any>>(record: T): T {
    const { createdAt, updatedAt, ...rest } = record
    return rest as T
  }

  const results: Record<string, number> = {}

  await prisma.$transaction(async (tx) => {
    // 1. Tags
    for (const t of tags) {
      await tx.tag.upsert({
        where: { id: t.id },
        update: own(t),
        create: own(t),
      })
    }
    results.tags = tags.length

    // 2. Sources
    for (const s of sources) {
      await tx.source.upsert({
        where: { id: s.id },
        update: own(s),
        create: own(s),
      })
    }
    results.sources = sources.length

    // 3. FeedItems
    for (const f of feedItems) {
      await tx.feedItem.upsert({
        where: { id: f.id },
        update: own(f),
        create: own(f),
      })
    }
    results.feedItems = feedItems.length

    // 4. FeedItemTags (junction — no userId field)
    for (const ft of feedItemTags) {
      await tx.feedItemTag.upsert({
        where: { feedItemId_tagId: { feedItemId: ft.feedItemId, tagId: ft.tagId } },
        update: ownChild(ft),
        create: ownChild(ft),
      })
    }
    results.feedItemTags = feedItemTags.length

    // 5. Digests
    for (const d of digests) {
      await tx.digest.upsert({
        where: { id: d.id },
        update: own(d),
        create: own(d),
      })
    }
    results.digests = digests.length

    // 6. DigestTags
    for (const dt of digestTags) {
      await tx.digestTag.upsert({
        where: { digestId_tagId: { digestId: dt.digestId, tagId: dt.tagId } },
        update: ownChild(dt),
        create: ownChild(dt),
      })
    }
    results.digestTags = digestTags.length

    // 7. TocEntries
    for (const te of tocEntries) {
      await tx.tocEntry.upsert({
        where: { id: te.id },
        update: ownChild(te),
        create: ownChild(te),
      })
    }
    results.tocEntries = tocEntries.length

    // 8. TocEntryArticles
    for (const ta of tocEntryArticles) {
      await tx.tocEntryArticle.upsert({
        where: { tocEntryId_feedItemId: { tocEntryId: ta.tocEntryId, feedItemId: ta.feedItemId } },
        update: ownChild(ta),
        create: ownChild(ta),
      })
    }
    results.tocEntryArticles = tocEntryArticles.length

    // 9. Subjects
    for (const s of subjects) {
      await tx.subject.upsert({
        where: { id: s.id },
        update: ownChild(s),
        create: ownChild(s),
      })
    }
    results.subjects = subjects.length

    // 10. SubjectFeedItems
    for (const sf of subjectFeedItems) {
      await tx.subjectFeedItem.upsert({
        where: { subjectId_feedItemId: { subjectId: sf.subjectId, feedItemId: sf.feedItemId } },
        update: ownChild(sf),
        create: ownChild(sf),
      })
    }
    results.subjectFeedItems = subjectFeedItems.length

    // 11. Notes
    for (const n of notes) {
      await tx.note.upsert({
        where: { id: n.id },
        update: own(n),
        create: own(n),
      })
    }
    results.notes = notes.length
  })

  return NextResponse.json({ ok: true, imported: results })
}