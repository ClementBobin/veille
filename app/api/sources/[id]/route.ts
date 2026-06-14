import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const source = await prisma.source.findUnique({ where: { id } })
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(source)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  // Autorise : name, url, type, active, cache
  const { name, url, type, active, cache } = body
  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (url !== undefined) data.url = url
  if (type !== undefined) data.type = type
  if (active !== undefined) data.active = active
  if (cache !== undefined) data.cache = cache

  const source = await prisma.source.update({ where: { id }, data })
  return NextResponse.json(source)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.source.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
