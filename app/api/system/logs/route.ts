import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))
  const path = searchParams.get('path') ?? undefined
  const method = searchParams.get('method') ?? undefined
  const status = searchParams.get('status') ? parseInt(searchParams.get('status')!, 10) : undefined
  const authType = searchParams.get('authType') ?? undefined

  const where = {
    userId,
    ...(path ? { path: { contains: path } } : {}),
    ...(method ? { method } : {}),
    ...(status ? { status } : {}),
    ...(authType ? { authType } : {}),
  }

  const [total, logs] = await Promise.all([
    prisma.requestLog.count({ where }),
    prisma.requestLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) })
}