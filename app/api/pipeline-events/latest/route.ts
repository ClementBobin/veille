import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

const WORKFLOWS = ['WF1', 'WF2', 'WF3', 'WF4']

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const events = await Promise.all(
    WORKFLOWS.map(async (workflow) => ({
      workflow,
      event: await prisma.pipelineEvent.findFirst({ where: { workflow, userId }, orderBy: { createdAt: 'desc' } }),
    }))
  )

  return NextResponse.json(events)
}