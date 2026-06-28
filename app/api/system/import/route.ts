import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

type EntityStats = { created: number; updated: number; skipped: number }

export async function POST(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    webhooks = [],
    themes = [],
    categories = [],
    tagCategories = [],
    sourceCategories = [],
    themeCategories = [],
  } = payload.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function own(record: any): any {
    const { createdAt: _c, updatedAt: _u, _count: _cnt, categories: _cats, ...rest } = record
    return { ...rest, userId }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function ownChild(record: any): any {
    const { createdAt: _c, updatedAt: _u, _count: _cnt, categories: _cats, ...rest } = record
    return rest
  }

  const stats: Record<string, EntityStats> = {}

  await prisma.$transaction(async (tx) => {
    // Tags
    const tagStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const t of tags) {
      const existing = await tx.tag.findUnique({ where: { id: t.id } })
      if (!existing) {
        await tx.tag.create({ data: own(t) })
        tagStats.created++
      } else {
        const updated = await tx.tag.updateMany({ where: { id: t.id, ...needsUpdate(existing, own(t)) ? {} : { id: '__never__' } }, data: own(t) })
        if (updated.count > 0) tagStats.updated++; else tagStats.skipped++
      }
    }
    stats.tags = tagStats

    // Sources
    const sourceStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const s of sources) {
      const existing = await tx.source.findUnique({ where: { id: s.id } })
      if (!existing) { await tx.source.create({ data: own(s) }); sourceStats.created++ }
      else { const r = await tx.source.updateMany({ where: { id: s.id, ...needsUpdate(existing, own(s)) ? {} : { id: '__never__' } }, data: own(s) }); if (r.count > 0) sourceStats.updated++; else sourceStats.skipped++ }
    }
    stats.sources = sourceStats

    // FeedItems
    const feedItemStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const f of feedItems) {
      const existing = await tx.feedItem.findUnique({ where: { id: f.id } })
      if (!existing) { await tx.feedItem.create({ data: own(f) }); feedItemStats.created++ }
      else { const r = await tx.feedItem.updateMany({ where: { id: f.id, ...needsUpdate(existing, own(f)) ? {} : { id: '__never__' } }, data: own(f) }); if (r.count > 0) feedItemStats.updated++; else feedItemStats.skipped++ }
    }
    stats.feedItems = feedItemStats

    // FeedItemTags (junction)
    const feedItemTagStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const ft of feedItemTags) {
      const existing = await tx.feedItemTag.findUnique({ where: { feedItemId_tagId: { feedItemId: ft.feedItemId, tagId: ft.tagId } } })
      if (!existing) { await tx.feedItemTag.create({ data: ownChild(ft) }); feedItemTagStats.created++ }
      else feedItemTagStats.skipped++
    }
    stats.feedItemTags = feedItemTagStats

    // Digests
    const digestStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const d of digests) {
      const existing = await tx.digest.findUnique({ where: { id: d.id } })
      if (!existing) { await tx.digest.create({ data: own(d) }); digestStats.created++ }
      else { const r = await tx.digest.updateMany({ where: { id: d.id, ...needsUpdate(existing, own(d)) ? {} : { id: '__never__' } }, data: own(d) }); if (r.count > 0) digestStats.updated++; else digestStats.skipped++ }
    }
    stats.digests = digestStats

    // DigestTags
    const digestTagStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const dt of digestTags) {
      const existing = await tx.digestTag.findUnique({ where: { digestId_tagId: { digestId: dt.digestId, tagId: dt.tagId } } })
      if (!existing) { await tx.digestTag.create({ data: ownChild(dt) }); digestTagStats.created++ }
      else digestTagStats.skipped++
    }
    stats.digestTags = digestTagStats

    // TocEntries
    const tocEntryStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const te of tocEntries) {
      const existing = await tx.tocEntry.findUnique({ where: { id: te.id } })
      if (!existing) { await tx.tocEntry.create({ data: ownChild(te) }); tocEntryStats.created++ }
      else { const r = await tx.tocEntry.updateMany({ where: { id: te.id, ...needsUpdate(existing, ownChild(te)) ? {} : { id: '__never__' } }, data: ownChild(te) }); if (r.count > 0) tocEntryStats.updated++; else tocEntryStats.skipped++ }
    }
    stats.tocEntries = tocEntryStats

    // TocEntryArticles
    const tocEntryArticleStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const ta of tocEntryArticles) {
      const existing = await tx.tocEntryArticle.findUnique({ where: { tocEntryId_feedItemId: { tocEntryId: ta.tocEntryId, feedItemId: ta.feedItemId } } })
      if (!existing) { await tx.tocEntryArticle.create({ data: ownChild(ta) }); tocEntryArticleStats.created++ }
      else tocEntryArticleStats.skipped++
    }
    stats.tocEntryArticles = tocEntryArticleStats

    // Subjects
    const subjectStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const s of subjects) {
      const existing = await tx.subject.findUnique({ where: { id: s.id } })
      if (!existing) { await tx.subject.create({ data: ownChild(s) }); subjectStats.created++ }
      else { const r = await tx.subject.updateMany({ where: { id: s.id, ...needsUpdate(existing, ownChild(s)) ? {} : { id: '__never__' } }, data: ownChild(s) }); if (r.count > 0) subjectStats.updated++; else subjectStats.skipped++ }
    }
    stats.subjects = subjectStats

    // SubjectFeedItems
    const subjectFeedItemStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const sf of subjectFeedItems) {
      const existing = await tx.subjectFeedItem.findUnique({ where: { subjectId_feedItemId: { subjectId: sf.subjectId, feedItemId: sf.feedItemId } } })
      if (!existing) { await tx.subjectFeedItem.create({ data: ownChild(sf) }); subjectFeedItemStats.created++ }
      else subjectFeedItemStats.skipped++
    }
    stats.subjectFeedItems = subjectFeedItemStats

    // Notes
    const noteStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const n of notes) {
      const existing = await tx.note.findUnique({ where: { id: n.id } })
      if (!existing) { await tx.note.create({ data: own(n) }); noteStats.created++ }
      else { const r = await tx.note.updateMany({ where: { id: n.id, ...needsUpdate(existing, own(n)) ? {} : { id: '__never__' } }, data: own(n) }); if (r.count > 0) noteStats.updated++; else noteStats.skipped++ }
    }
    stats.notes = noteStats

    // Webhooks (never import secrets — keep existing secret if present)
    const webhookStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const w of webhooks) {
      const { secret: _s, logs: _l, ...rest } = w
      const data = own(rest)
      const existing = await tx.webhook.findUnique({ where: { id: w.id } })
      if (!existing) {
        await tx.webhook.create({ data })
        webhookStats.created++
      } else {
        // Preserve the existing secret
        const { secret: existingSecret } = existing
        const r = await tx.webhook.updateMany({
          where: { id: w.id, ...needsUpdate(existing, { ...data, secret: existingSecret }) ? {} : { id: '__never__' } },
          data: { ...data, secret: existingSecret },
        })
        if (r.count > 0) webhookStats.updated++; else webhookStats.skipped++
      }
    }
    stats.webhooks = webhookStats

    // Themes
    const themeStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const t of themes) {
      const existing = await tx.theme.findUnique({ where: { id: t.id } })
      if (!existing) {
        await tx.theme.create({ data: own(t) })
        themeStats.created++
      } else {
        const r = await tx.theme.updateMany({
          where: { id: t.id, ...needsUpdate(existing, own(t)) ? {} : { id: '__never__' } },
          data: own(t),
        })
        if (r.count > 0) themeStats.updated++; else themeStats.skipped++
      }
    }
    stats.themes = themeStats

    // Categories — strip _count which is injected by the export include
    const categoryStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const c of categories) {
      const { _count: _cnt, ...rest } = c
      const data = own(rest)
      const existing = await tx.category.findUnique({ where: { id: c.id } })
      if (!existing) {
        await tx.category.create({ data })
        categoryStats.created++
      } else {
        const r = await tx.category.updateMany({
          where: { id: c.id, ...needsUpdate(existing, data) ? {} : { id: '__never__' } },
          data,
        })
        if (r.count > 0) categoryStats.updated++; else categoryStats.skipped++
      }
    }
    stats.categories = categoryStats

    // TagCategories — pure junction, no userId/timestamps
    const tagCategoryStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const tc of tagCategories) {
      const { tagId, categoryId } = tc
      const existing = await tx.tagCategory.findUnique({
        where: { tagId_categoryId: { tagId, categoryId } },
      })
      if (!existing) { await tx.tagCategory.create({ data: { tagId, categoryId } }); tagCategoryStats.created++ }
      else tagCategoryStats.skipped++
    }
    stats.tagCategories = tagCategoryStats

    // SourceCategories — pure junction
    const sourceCategoryStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const sc of sourceCategories) {
      const { sourceId, categoryId } = sc
      const existing = await tx.sourceCategory.findUnique({
        where: { sourceId_categoryId: { sourceId, categoryId } },
      })
      if (!existing) { await tx.sourceCategory.create({ data: { sourceId, categoryId } }); sourceCategoryStats.created++ }
      else sourceCategoryStats.skipped++
    }
    stats.sourceCategories = sourceCategoryStats

    // ThemeCategories — pure junction
    const themeCategoryStats: EntityStats = { created: 0, updated: 0, skipped: 0 }
    for (const tc of themeCategories) {
      const { themeId, categoryId } = tc
      const existing = await tx.themeCategory.findUnique({
        where: { themeId_categoryId: { themeId, categoryId } },
      })
      if (!existing) { await tx.themeCategory.create({ data: { themeId, categoryId } }); themeCategoryStats.created++ }
      else themeCategoryStats.skipped++
    }
    stats.themeCategories = themeCategoryStats
  })

  const totals: Record<string, number> = {}
  for (const [entity, s] of Object.entries(stats)) {
    totals[entity] = s.created + s.updated + s.skipped
  }

  return NextResponse.json({ ok: true, imported: stats, totals })
}

/** Returns true if any field in `next` differs from `existing`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function needsUpdate(existing: any, next: any): boolean {
  return Object.keys(next).some(k => {
    const a = existing[k]
    const b = next[k]
    if (a instanceof Date) return a.getTime() !== new Date(b).getTime()
    return JSON.stringify(a) !== JSON.stringify(b)
  })
}