import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(sources)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, url, type } = body
  if (!name || !url || !type) {
    return NextResponse.json({ error: 'name, url, type required' }, { status: 400 })
  }
  const source = await prisma.source.create({ data: { name, url, type } })
  return NextResponse.json(source, { status: 201 })
}