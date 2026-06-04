import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const source = await prisma.source.update({ where: { id: params.id }, data: body })
  return NextResponse.json(source)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.source.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}