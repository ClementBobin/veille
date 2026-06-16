import { NextRequest, NextResponse } from "next/server"
import { hashKey } from "./auth"
import { prisma } from "./prisma"

export async function verifyApiKey(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''

  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing Bearer token' },
      { status: 401 }
    )
  }

  const token = auth.slice(7)

  const hash = hashKey(token)

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
  })

  if (!key) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null
}