import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await verifyApiKey(req)
  
  if (authError) {
    return authError
  }
    
  const { id } = await params
  await prisma.feedItem.update({
    where: { id },
    data: { processed: true },
  })
  return NextResponse.json({ ok: true })
}