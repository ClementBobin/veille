import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.tag.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const tag = await prisma.tag.update({ where: { id }, data: body })
  return NextResponse.json(tag)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.tag.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})