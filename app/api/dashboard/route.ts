import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

const WORKFLOWS = ['WF1', 'WF2', 'WF3', 'WF4']

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const [tags, sources, digests, notes, recentNotes, recentSources, pipelineEvents] = await Promise.all([
    prisma.tag.count({ where: { userId } }),
    prisma.source.count({ where: { userId, active: true } }),
    prisma.digest.count({ where: { userId, status: 'PENDING' } }),
    prisma.note.count({ where: { userId } }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, filename: true, createdAt: true },
    }),
    prisma.source.findMany({
      where: { userId },
      orderBy: { lastFetch: 'desc' },
      take: 4,
      select: { id: true, name: true, type: true, active: true, lastFetch: true },
    }),
    Promise.all(
      WORKFLOWS.map(async workflow => ({
        workflow,
        event: await prisma.pipelineEvent.findFirst({
          where: { workflow, userId },
          orderBy: { createdAt: 'desc' },
        }),
      }))
    ),
  ])

  return NextResponse.json({ tags, sources, digests, notes, recentNotes, recentSources, pipelineEvents })
})
