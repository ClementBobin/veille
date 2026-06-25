import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

function safeParseJson(value: string, fallback: unknown) {
  try { return JSON.parse(value) } catch { return fallback }
}

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const theme = await prisma.theme.findFirst({ where: { id, userId } })
  if (!theme) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...theme, tags: safeParseJson(theme.tags, []) })
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.theme.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, tags, active, validationCriteria } = body

  if (title !== undefined && title !== existing.title) {
    const dup = await prisma.theme.findFirst({
      where: { userId, title: { equals: title, mode: 'insensitive' }, id: { not: id } },
    })
    if (dup) return NextResponse.json({ error: 'A theme with this title already exists' }, { status: 409 })
  }

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description ?? null
  if (tags !== undefined) data.tags = JSON.stringify(Array.isArray(tags) ? tags : [])
  if (active !== undefined) data.active = active
  if (validationCriteria !== undefined) data.validationCriteria = validationCriteria ?? null

  const theme = await prisma.theme.update({ where: { id }, data })
  return NextResponse.json({ ...theme, tags: safeParseJson(theme.tags, []) })
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const existing = await prisma.theme.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.theme.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})