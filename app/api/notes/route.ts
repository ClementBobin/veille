import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// WF5 stores the generated markdown note
export async function POST(req: NextRequest) {
  const { title, content, digestId, filename, exportedTo } = await req.json()

  const note = await prisma.note.create({
    data: { title, content, digestId, filename, exportedTo: exportedTo ?? [] },
  })

  if (digestId) {
    await prisma.digest.update({ where: { id: digestId }, data: { status: 'DONE' } })
  }

  await prisma.pipelineEvent.create({
    data: { workflow: 'WF5', status: 'done', message: `Note générée : ${filename}` },
  })

  return NextResponse.json(note, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const note = await prisma.note.findUnique({ where: { id } })
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(note)
  }

  const notes = await prisma.note.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(notes)
}
