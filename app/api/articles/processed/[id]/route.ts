import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const POST = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.feedItem.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.feedItem.update({ where: { id }, data: { processed: true } })
  return NextResponse.json({ ok: true })
})