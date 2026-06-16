import { NextRequest, NextResponse } from "next/server"
import { hashKey } from "./auth"
import { prisma } from "./prisma"

export async function verifyApiKey(req: NextRequest) {
  // 1. Accept valid session cookie (web UI)
  const session = req.cookies.get('session')?.value
  if (session && session === process.env.SESSION_SECRET) {
    return null // authorized
  }

  // 2. Accept Bearer API key (n8n / programmatic)
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const hash = hashKey(token)
    const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } })
    if (key) return null // authorized
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}