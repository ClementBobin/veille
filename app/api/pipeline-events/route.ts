import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WF1_BRANCHES = ['rss', 'api', 'scraping', 'video']

export async function GET() {
  const events = await prisma.pipelineEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { workflow, status, message, runId, branch } = body

  const event = await prisma.pipelineEvent.create({
    data: { workflow, status, message, runId, branch },
  })

  if (workflow === 'WF1' && status === 'branch-done' && runId) {
    const done = await prisma.pipelineEvent.findMany({
      where: { workflow: 'WF1', status: 'branch-done', runId },
      select: { branch: true },
      distinct: ['branch'],
    })
    const doneBranches = done.map(e => e.branch).filter(Boolean) as string[]

    // Premier signal → enregistre le timestamp de départ
    // Déclenche WF2 si aucun nouveau signal depuis 60s
    const lastSignal = await prisma.pipelineEvent.findFirst({
      where: { workflow: 'WF1', status: 'branch-done', runId },
      orderBy: { createdAt: 'desc' },
    })

    const alreadyTriggered = await prisma.pipelineEvent.findFirst({
      where: { workflow: 'WF1', status: 'done', runId },
    })

    if (!alreadyTriggered) {
      // Schedula le trigger après 60s d'inactivité
      setTimeout(async () => {
        const stillPending = await prisma.pipelineEvent.findFirst({
          where: { workflow: 'WF1', status: 'done', runId },
        })
        if (!stillPending) {
          await prisma.pipelineEvent.create({
            data: { workflow: 'WF1', status: 'done', message: 'Collecte terminée', runId },
          })
          await fetch('https://n8n.tail025bf6.ts.net/webhook/start-wf2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger: 'wf1-done' }),
          })
        }
      }, 60_000)
    }
  }

  return NextResponse.json(event, { status: 201 })
}