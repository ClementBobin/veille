import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'

export async function GET(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const authError = await verifyApiKey(req)

  if (authError) {
    return authError
  }

  const body = await req.json()
  const { name, color, description } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const tag = await prisma.tag.create({ data: { name, color: color ?? '#6366f1', description } })
  return NextResponse.json(tag, { status: 201 })
}
