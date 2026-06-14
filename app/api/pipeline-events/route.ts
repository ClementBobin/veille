import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST — n8n ou Next.js enregistre un événement de pipeline
export async function POST(req: NextRequest) {
  const { workflow, status, message } = await req.json()
  if (!workflow || !status)
    return NextResponse.json({ error: 'workflow + status required' }, { status: 400 })

  const event = await prisma.pipelineEvent.create({
    data: { workflow, status, message },
  })
  return NextResponse.json(event, { status: 201 })
}

// GET — renvoie le dernier événement de chaque WF pour le dashboard
export async function GET() {
  const workflows = ['WF1', 'WF2', 'WF3', 'WF4', 'WF5']

  const latest = await Promise.all(
    workflows.map(async (wf) => {
      const event = await prisma.pipelineEvent.findFirst({
        where: { workflow: wf },
        orderBy: { createdAt: 'desc' },
      })
      return { workflow: wf, event }
    })
  )

  return NextResponse.json(latest)
}
