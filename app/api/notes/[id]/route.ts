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