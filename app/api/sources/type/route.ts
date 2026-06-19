import { NextResponse } from 'next/server'
import { SourceType } from '@/prisma/generated/client'
import { verifyApiKey } from '@/lib/verifyApiKey'

export async function GET(req: Request) {
  //const authError = await verifyApiKey(req)
  //if (authError) return authError

    return NextResponse.json(Object.values(SourceType))
}