import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateKey, hashKey } from '@/lib/auth'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(keys)
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const raw = generateKey()
  await prisma.apiKey.create({ data: { name, keyHash: hashKey(raw), userId } })

  return NextResponse.json({ key: raw, name }, { status: 201 })
})

export const DELETE = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await req.json()
  const existing = await prisma.apiKey.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})