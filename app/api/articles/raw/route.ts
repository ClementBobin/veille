import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'

// n8n WF1 — store raw feed items
export async function POST(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const body = await req.json()
  const items = Array.isArray(body) ? body : [body]

  const results = await Promise.allSettled(
    items.map(({ title, url, content, sourceId, publishedAt }) =>
      

      prisma.feedItem.upsert({
        where: { url },
        update: {},  // on ne réécrit pas si déjà présent (idempotent)
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

  // Mise à jour du lastFetch sur les sources concernées
  const sourceIds = [...new Set(items.map((i) => i.sourceId).filter(Boolean))]
  if (sourceIds.length) {
    await prisma.source.updateMany({
      where: { id: { in: sourceIds } },
      data: { lastFetch: new Date() },
    })
  }

  const created = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ created, total: items.length }, { status: 201 })
}

// n8n WF2 — read unprocessed feed items
// ?unprocessed=true  → items pas encore traités par le LLM
// (pas de query)     → tous les items
export async function GET(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const { searchParams } = new URL(req.url)
  const unprocessed = searchParams.get('unprocessed') === 'true'

  const items = await prisma.feedItem.findMany({
    where: unprocessed ? { processed: false } : undefined,
    include: { source: true, tags: { include: { tag: true } } },
    orderBy: { fetchedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(items)
}
