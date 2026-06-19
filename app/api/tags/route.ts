import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'

export async function GET(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const tags = await prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } })
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { name, color, description } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const tag = await prisma.tag.create({ data: { name, color: color ?? '#6366f1', description, userId } })
  return NextResponse.json(tag, { status: 201 })
}