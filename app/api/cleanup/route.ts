import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

const RETENTION_DAYS = process.env.RETENTION_DAYS ? parseInt(process.env.RETENTION_DAYS, 10) : 7

export async function DELETE(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dryRun') === 'true'

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

  const cleanupWhere = {
    userId,
    fetchedAt: { lt: cutoff },
    OR: [{ source: { cache: false } }, { source: { active: false } }],
  }

  const toDelete = await prisma.feedItem.findMany({
    where: cleanupWhere,
    select: { id: true, title: true, fetchedAt: true, sourceId: true },
  })

  if (dryRun) {
    return NextResponse.json({ dryRun: true, cutoff: cutoff.toISOString(), count: toDelete.length, items: toDelete })
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ dryRun: false, cutoff: cutoff.toISOString(), deleted: 0 })
  }

  const result = await prisma.feedItem.deleteMany({ where: { id: { in: toDelete.map((item) => item.id) } } })

  await prisma.pipelineEvent.create({
    data: {
      workflow: 'cleanup',
      status: 'done',
      message: `${result.count} FeedItem(s) supprimé(s) (cutoff ${cutoff.toISOString()})`,
      userId,
    },
  })

  return NextResponse.json({ dryRun: false, cutoff: cutoff.toISOString(), deleted: result.count })
}

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

  const count = await prisma.feedItem.count({
    where: {
      userId,
      fetchedAt: { lt: cutoff },
      OR: [{ source: { cache: false } }, { source: { active: false } }],
    },
  })

  return NextResponse.json({ cutoff: cutoff.toISOString(), eligibleForCleanup: count })
}