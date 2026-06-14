import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Web UI sélection — sauvegarde + déclenche WF5
export async function POST(req: NextRequest) {
  const { digestId, selectedSubjectIds } = await req.json()

  await prisma.subject.updateMany({ where: { digestId }, data: { selected: false } })
  await prisma.subject.updateMany({
    where: { id: { in: selectedSubjectIds }, digestId },
    data: { selected: true },
  })
  await prisma.digest.update({ where: { id: digestId }, data: { status: 'SELECTED' } })

  // Enregistre l'événement pipeline
  await prisma.pipelineEvent.create({
    data: { workflow: 'WF4', status: 'done', message: `${selectedSubjectIds.length} sujets sélectionnés` },
  })

  // Déclenche WF5 directement depuis Next.js
  const n8nUrl = process.env.N8N_BASE_URL ?? 'http://localhost:5678'
  try {
    await fetch(`${n8nUrl}/webhook/start-wf5`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ digestId }),
    })
  } catch (err) {
    console.error('[WF5 trigger] Erreur :', err)
    // On ne bloque pas la réponse — WF5 sera relancé manuellement si besoin
  }

  return NextResponse.json({ ok: true, selected: selectedSubjectIds.length })
}

// WF5 — lit les sujets sélectionnés
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const digestId = searchParams.get('digestId')

  const subjects = await prisma.subject.findMany({
    where: { selected: true, ...(digestId ? { digestId } : {}) },
    include: {
      feedItems: { include: { feedItem: { include: { source: true } } } },
      digest: true,
    },
  })
  return NextResponse.json(subjects)
}
