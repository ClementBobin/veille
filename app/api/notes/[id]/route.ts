import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const note = await prisma.note.findFirst({ where: { id, userId } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(note)
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.note.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, content, filename, exportedTo } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (content !== undefined) data.content = content
  if (filename !== undefined) data.filename = filename
  if (exportedTo !== undefined) {
    data.exportedTo = Array.isArray(exportedTo) ? exportedTo.join(',') : exportedTo
  }

  const note = await prisma.note.update({ where: { id }, data })
  return NextResponse.json(note)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const note = await prisma.note.findFirst({ where: { id, userId } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.note.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})