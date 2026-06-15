import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  await prisma.feedItem.update({
    where: { id },
    data: { processed: true },
  })
  return NextResponse.json({ ok: true })
}