// app/api/system/cleanup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { getUserConfig } from '@/lib/user-config'
import { dispatchWebhook } from '@/lib/webhook'
import { CleanupMode } from '@/types/cleanup'

// Helper to parse cleanup mode from query params
function getCleanupMode(searchParams: URLSearchParams): CleanupMode {
  const dryRun = searchParams.get('dryRun') === 'true'
  const forced = searchParams.get('forced') === 'true'
  
  if (dryRun && forced) return CleanupMode.DRY_RUN_FORCED
  if (dryRun) return CleanupMode.DRY_RUN
  if (forced) return CleanupMode.FORCED
  return CleanupMode.STANDARD
}

// Helper to build where clause based on mode
function buildCleanupWhere(userId: string, cutoff: Date, mode: CleanupMode) {
  const baseWhere = {
    userId,
    fetchedAt: { lt: cutoff },
  }

  // Forced modes: delete ALL items older than cutoff
  if (mode === CleanupMode.FORCED || mode === CleanupMode.DRY_RUN_FORCED) {
    return baseWhere
  }

  // Standard modes: only delete items from inactive or non-cached sources
  return {
    ...baseWhere,
    OR: [
      { source: { cache: false } },
      { source: { active: false } }
    ]
  }
}

export const DELETE = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { retentionDays } = await getUserConfig(userId)
  const { searchParams } = new URL(req.url)
  const mode = getCleanupMode(searchParams)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  // If dry run, redirect to GET with same params
  if (mode === CleanupMode.DRY_RUN || mode === CleanupMode.DRY_RUN_FORCED) {
    const dryRunResult = await getCleanupPreview(userId, retentionDays, cutoff, mode)
    return NextResponse.json({
      ...dryRunResult,
      mode,
      dryRun: true,
    })
  }

  const where = buildCleanupWhere(userId, cutoff, mode)
  
  // Get items to delete with a limit for safety
  const MAX_DELETE_LIMIT = 10000
  const toDelete = await prisma.feedItem.findMany({
    where,
    select: { id: true },
    take: mode === CleanupMode.FORCED ? MAX_DELETE_LIMIT : undefined,
  })

  if (toDelete.length === 0) {
    return NextResponse.json({
      dryRun: false,
      cutoff: cutoff.toISOString(),
      deleted: 0,
      mode,
      message: 'No items eligible for cleanup'
    })
  }

  // Safety check for forced mode
  if (mode === CleanupMode.FORCED && toDelete.length >= MAX_DELETE_LIMIT) {
    return NextResponse.json({
      error: 'Forced cleanup would delete too many items (limit exceeded)',
      count: toDelete.length,
      limit: MAX_DELETE_LIMIT,
      suggestion: 'Use dry-run-forced to preview first'
    }, { status: 422 })
  }

  const result = await prisma.feedItem.deleteMany({
    where: { id: { in: toDelete.map(i => i.id) } }
  })

  // Create pipeline event
  const event = await prisma.pipelineEvent.create({
    data: {
      workflow: 'cleanup',
      status: 'done',
      message: `${result.count} FeedItem(s) deleted (cutoff ${cutoff.toISOString()}) - ${mode} mode`,
      userId,
    },
  })

  dispatchWebhook(userId, 'pipeline-event', event).catch(() => {})

  return NextResponse.json({
    dryRun: false,
    cutoff: cutoff.toISOString(),
    deleted: result.count,
    mode,
  })
})

// Helper function for GET (preview) requests
async function getCleanupPreview(userId: string, retentionDays: number, cutoff: Date, mode: CleanupMode) {
  const where = buildCleanupWhere(userId, cutoff, mode)
  
  const [count, items] = await Promise.all([
    prisma.feedItem.count({ where }),
    prisma.feedItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        fetchedAt: true,
        sourceId: true,
      },
      take: 100, // Limit preview items
    })
  ])

  return {
    cutoff: cutoff.toISOString(),
    count,
    items,
    retentionDays,
    mode,
  }
}

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { retentionDays } = await getUserConfig(userId)
  const { searchParams } = new URL(req.url)
  const mode = getCleanupMode(searchParams)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  // If dry run requested, return preview
  if (mode === CleanupMode.DRY_RUN || mode === CleanupMode.DRY_RUN_FORCED) {
    const preview = await getCleanupPreview(userId, retentionDays, cutoff, mode)
    return NextResponse.json(preview)
  }

  // Standard GET - return cleanup info
  const where = buildCleanupWhere(userId, cutoff, CleanupMode.STANDARD)
  const count = await prisma.feedItem.count({ where })

  return NextResponse.json({
    cutoff: cutoff.toISOString(),
    eligibleForCleanup: count,
    retentionDays,
    mode: CleanupMode.STANDARD,
  })
})