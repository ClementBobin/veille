import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

// PATCH /api/sources/bulk
// body: { ids: string[], active: boolean }
// Bulk enable/disable sources belonging to the authenticated user.
export const PATCH = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { ids, active } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
  }
  if (typeof active !== 'boolean') {
    return NextResponse.json({ error: 'active must be a boolean' }, { status: 400 })
  }

  const result = await prisma.source.updateMany({
    where: { id: { in: ids }, userId },
    data: { active },
  })

  return NextResponse.json({ ok: true, updated: result.count })
})