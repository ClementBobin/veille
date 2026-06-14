import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const tag = await prisma.tag.update({ where: { id }, data: body })
  return NextResponse.json(tag)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}