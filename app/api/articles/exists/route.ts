import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

function contentHash(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex')
}

type CheckInput = {
  url?: string
  content?: string
}

type CheckResult = {
  url?: string
  contentHash?: string
  exists: boolean
  id?: string
  title?: string
  fetchedAt?: string
}

async function checkOne(userId: string, input: CheckInput): Promise<CheckResult> {
  const { url, content } = input
  const hash = content ? contentHash(content) : undefined

  // Try URL match first (exact, indexed)
  if (url) {
    const byUrl = await prisma.feedItem.findFirst({
      where: { userId, url },
      select: { id: true, title: true, fetchedAt: true },
    })
    if (byUrl) {
      return { url, contentHash: hash, exists: true, id: byUrl.id, title: byUrl.title, fetchedAt: byUrl.fetchedAt.toISOString() }
    }
  }

  // Fall back to content hash match if content provided
  if (hash) {
    // We store a tagsHash on FeedItem but not a content hash — do a content comparison
    // via a substring match on the first 100 chars to avoid full-table scans
    const snippet = content!.trim().slice(0, 100)
    const byContent = await prisma.feedItem.findFirst({
      where: {
        userId,
        content: { startsWith: snippet },
      },
      select: { id: true, title: true, url: true, fetchedAt: true },
    })
    if (byContent) {
      return { url, contentHash: hash, exists: true, id: byContent.id, title: byContent.title, fetchedAt: byContent.fetchedAt.toISOString() }
    }
  }

  return { url, contentHash: hash, exists: false }
}

/**
 * GET /api/articles/exists?url=<url>&content=<content>
 * Quick single-article check. Returns { exists, id?, title?, fetchedAt? }
 */
export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url') ?? undefined
  const content = searchParams.get('content') ?? undefined

  if (!url && !content) {
    return NextResponse.json({ error: 'At least one of url or content is required' }, { status: 400 })
  }

  const result = await checkOne(userId, { url, content })
  return NextResponse.json(result)
})

/**
 * POST /api/articles/exists
 * Batch check. Body: { items: Array<{ url?, content? }> }
 * Returns { results: CheckResult[], existingCount, newCount }
 *
 * Also accepts a flat array directly: [{ url?, content? }, ...]
 */
export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const items: CheckInput[] = Array.isArray(body) ? body : (body.items ?? [])

  if (!items.length) {
    return NextResponse.json({ error: 'items array is required and must not be empty' }, { status: 400 })
  }
  if (items.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 items per request' }, { status: 400 })
  }

  // Batch the URL lookups in a single query for performance
  const urls = items.map(i => i.url).filter((u): u is string => !!u)

  const existingByUrl = urls.length
    ? await prisma.feedItem.findMany({
        where: { userId, url: { in: urls } },
        select: { id: true, title: true, url: true, fetchedAt: true },
      })
    : []

  const urlMap = new Map(existingByUrl.map(e => [e.url, e]))

  // For items not found by URL, fall back to individual content checks
  const results: CheckResult[] = await Promise.all(
    items.map(async item => {
      const { url, content } = item
      const hash = content ? contentHash(content) : undefined

      // URL hit from batch query
      if (url && urlMap.has(url)) {
        const found = urlMap.get(url)!
        return { url, contentHash: hash, exists: true, id: found.id, title: found.title, fetchedAt: found.fetchedAt.toISOString() }
      }

      // Content fallback (individual query — only runs if no URL match)
      if (content) {
        const snippet = content.trim().slice(0, 100)
        const byContent = await prisma.feedItem.findFirst({
          where: { userId, content: { startsWith: snippet } },
          select: { id: true, title: true, url: true, fetchedAt: true },
        })
        if (byContent) {
          return { url, contentHash: hash, exists: true, id: byContent.id, title: byContent.title, fetchedAt: byContent.fetchedAt.toISOString() }
        }
      }

      return { url, contentHash: hash, exists: false }
    })
  )

  const existingCount = results.filter(r => r.exists).length
  const newCount = results.length - existingCount

  return NextResponse.json({ results, existingCount, newCount, total: results.length })
})
