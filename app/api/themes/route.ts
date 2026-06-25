import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const themes = await prisma.theme.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(
    themes.map((t: { tags: string; [key: string]: unknown }) => ({ ...t, tags: safeParseJson(t.tags, []) })),
  )
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { title, description, tags, active, validationCriteria } = body

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const existing = await prisma.theme.findFirst({
    where: { userId, title: { equals: title, mode: 'insensitive' } },
  })
  if (existing) return NextResponse.json({ error: 'A theme with this title already exists' }, { status: 409 })

  const theme = await prisma.theme.create({
    data: {
      userId,
      title,
      description: description ?? null,
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      active: active ?? true,
      validationCriteria: validationCriteria ?? null,
    },
  })

  return NextResponse.json({ ...theme, tags: safeParseJson(theme.tags, []) }, { status: 201 })
})

function safeParseJson(value: string, fallback: unknown) {
  try { return JSON.parse(value) } catch { return fallback }
}