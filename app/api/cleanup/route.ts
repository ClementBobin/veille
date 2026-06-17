import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'

const RETENTION_DAYS = process.env.RETENTION_DAYS
  ? parseInt(process.env.RETENTION_DAYS, 10)
  : 7

// Cleanup — supprime les FeedItem (et cascade FeedItemTag / SubjectFeedItem / TocEntryArticle)
// plus vieux que RETENTION_DAYS dont :
// - la source a cache=false
// - OU la source est inactive (active=false)
// ?dryRun=true → ne supprime rien, retourne juste ce qui serait supprimé.
export async function DELETE(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dryRun') === 'true'

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

  const cleanupWhere = {
    fetchedAt: { lt: cutoff },
    OR: [
      {
        source: {
          cache: false,
        },
      },
      {
        source: {
          active: false,
        },
      },
    ],
  }

  // findMany d'abord : deleteMany ne filtre pas toujours correctement
  // sur certains champs relationnels dans toutes les bases.
  const toDelete = await prisma.feedItem.findMany({
    where: cleanupWhere,
    select: {
      id: true,
      title: true,
      fetchedAt: true,
      sourceId: true,
    },
  })

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      cutoff: cutoff.toISOString(),
      count: toDelete.length,
      items: toDelete,
    })
  }

  if (toDelete.length === 0) {
    return NextResponse.json({
      dryRun: false,
      cutoff: cutoff.toISOString(),
      deleted: 0,
    })
  }

  const result = await prisma.feedItem.deleteMany({
    where: {
      id: {
        in: toDelete.map((item) => item.id),
      },
    },
  })

  await prisma.pipelineEvent.create({
    data: {
      workflow: 'cleanup',
      status: 'done',
      message: `${result.count} FeedItem(s) supprimé(s) (cutoff ${cutoff.toISOString()})`,
    },
  })

  return NextResponse.json({
    dryRun: false,
    cutoff: cutoff.toISOString(),
    deleted: result.count,
  })
}

// Inspection rapide sans suppression — équivalent à DELETE ?dryRun=true
// utile pour un monitoring ou un cron externe.
export async function GET(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

  const cleanupWhere = {
    fetchedAt: { lt: cutoff },
    OR: [
      {
        source: {
          cache: false,
        },
      },
      {
        source: {
          active: false,
        },
      },
    ],
  }

  const count = await prisma.feedItem.count({
    where: cleanupWhere,
  })

  return NextResponse.json({
    cutoff: cutoff.toISOString(),
    eligibleForCleanup: count,
  })
}