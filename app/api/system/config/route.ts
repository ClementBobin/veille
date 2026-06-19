import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

const ALLOWED_KEYS = ['N8N_BASE_URL', 'N8N_WEBHOOK_PATH', 'RETENTION_DAYS'] as const
type ConfigKey = typeof ALLOWED_KEYS[number]

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const configs = await prisma.config.findMany({ where: { userId } })
  const result = Object.fromEntries(configs.map(c => [c.key, c.value]))
  return NextResponse.json(result)
})

export const PATCH = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body: Partial<Record<ConfigKey, string>> = await req.json()
  const updates: { key: string; value: string }[] = []

  for (const key of ALLOWED_KEYS) {
    if (body[key] === undefined) continue
    const value = String(body[key]).trim()
    updates.push({ key, value })
  }

  if (!updates.length) return NextResponse.json({ error: 'No valid keys provided' }, { status: 400 })

  await Promise.all(
    updates.map(({ key, value }) =>
      prisma.config.upsert({
        where: { userId_key: { userId, key } },
        update: { value },
        create: { userId, key, value },
      })
    )
  )

  return NextResponse.json({ ok: true, updated: updates.map(u => u.key) })
})