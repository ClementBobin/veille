import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

function hashTags(tags: string[]): string {
  return createHash('md5').update([...tags].sort().join('|')).digest('hex')
}

// n8n WF2 — store / update categorization result
// Si les tags n'ont pas changé (même hash), on ne re-poste pas → 304-like JSON
export async function POST(req: NextRequest) {
  const body = await req.json()
  const feedItemId = body.feedItemId ?? body.articleId ?? body.id
  const { tags = [], score = 0, relevant = false } = body

  // Calcule le hash des tags reçus
  const newHash = hashTags(tags)

  // Vérifie si le feedItem existe déjà avec le même hash
  const existing = await prisma.feedItem.findUnique({
    where: { id: feedItemId },
    select: { tagsHash: true, processed: true },
  })

  if (existing?.tagsHash === newHash && existing?.processed) {
    // Rien n'a changé → on skippe
    return NextResponse.json({ skipped: true, reason: 'tags_unchanged' })
  }

  // Résout les noms de tags en IDs
  let tagIds: string[] = []
  if (relevant && tags.length) {
    const found = await prisma.tag.findMany({
      where: { name: { in: tags } },
      select: { id: true },
    })
    tagIds = found.map((t) => t.id)
  }

  // Met à jour le feedItem (supprime les anciens tags, repose les nouveaux)
  const updated = await prisma.feedItem.update({
    where: { id: feedItemId },
    data: {
      relevant,
      score,
      processed: true,
      tagsHash: newHash,
      tags: {
        deleteMany: {},   // supprime les associations existantes
        ...(tagIds.length
          ? {
              createMany: {
                data: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
    },
  })

  return NextResponse.json(updated)
}

// n8n WF3 — read categorized relevant feedItems not yet in a digest
// Supporte ?resumeFrom=<feedItemId> pour reprendre après crash LLM
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const resumeFrom = searchParams.get('resumeFrom')

  const items = await prisma.feedItem.findMany({
    where: {
      relevant: true,
      processed: true,
      subjects: { none: {} },
      ...(resumeFrom
        ? {
            // reprend à partir de l'ID indiqué (cursor-based)
            id: { gt: resumeFrom },
          }
        : {}),
    },
    include: { tags: { include: { tag: true } }, source: true },
    orderBy: { fetchedAt: 'desc' },
  })
  return NextResponse.json(items)
}
