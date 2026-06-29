import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

const include = {
  messages: { orderBy: { order: 'asc' as const } },
}

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const prompts = await prisma.prompt.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include,
  })

  return NextResponse.json(prompts)
})

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const { name, description, messages } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const dup = await prisma.prompt.findFirst({
    where: { userId, name: { equals: name.trim(), mode: 'insensitive' } },
  })
  if (dup) return NextResponse.json({ error: 'A prompt with this name already exists' }, { status: 409 })

  const prompt = await prisma.prompt.create({
    data: {
      userId,
      name: name.trim(),
      description: description ?? null,
      messages: messages?.length
        ? {
            create: (messages as { role: string; content: string }[]).map((m, i) => ({
              role: m.role,
              content: m.content,
              order: i,
            })),
          }
        : undefined,
    },
    include,
  })

  dispatchWebhook(userId, 'prompt.created', prompt).catch(() => {})
  return NextResponse.json(prompt, { status: 201 })
})
