import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { getUserConfig } from '@/lib/user-config'

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const events = await prisma.pipelineEvent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json(events)
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { workflow, status, message, runId, branch } = body

  const event = await prisma.pipelineEvent.create({ data: { workflow, status, message, runId, branch, userId } })

  if (workflow === 'WF1' && status === 'branch-done' && runId) {
    const alreadyTriggered = await prisma.pipelineEvent.findFirst({
      where: { workflow: 'WF1', status: 'done', runId, userId },
    })
    if (!alreadyTriggered) {
      const capturedUserId = userId
      setTimeout(async () => {
        const stillPending = await prisma.pipelineEvent.findFirst({
          where: { workflow: 'WF1', status: 'done', runId, userId: capturedUserId },
        })
        if (!stillPending) {
          const { n8nBaseUrl, n8nWebhookPath } = await getUserConfig(capturedUserId)
          await prisma.pipelineEvent.create({
            data: { workflow: 'WF1', status: 'done', message: 'Collecte terminée', runId, userId: capturedUserId },
          })
          await fetch(`${n8nBaseUrl}/${n8nWebhookPath}/start-wf2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger: 'wf1-done', userId: capturedUserId }),
          })
        }
      }, 60_000)
    }
  }

  return NextResponse.json(event, { status: 201 })
})