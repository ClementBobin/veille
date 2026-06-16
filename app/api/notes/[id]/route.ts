import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyApiKey(req)
  if (authError) return authError

  const { id } = await params
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(note)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyApiKey(req)
  if (authError) return authError

  const { id } = await params
  await prisma.note.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}