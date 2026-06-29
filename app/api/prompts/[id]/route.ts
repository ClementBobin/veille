import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

const include = {
  messages: { orderBy: { order: 'asc' as const } },
}

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const prompt = await prisma.prompt.findFirst({ where: { id, userId }, include })
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(prompt)
})

export const PATCH = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.prompt.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, messages } = body

  if (name !== undefined && name.trim() !== existing.name) {
    const dup = await prisma.prompt.findFirst({
      where: { userId, name: { equals: name.trim(), mode: 'insensitive' }, id: { not: id } },
    })
    if (dup) return NextResponse.json({ error: 'A prompt with this name already exists' }, { status: 409 })
  }

  await prisma.$transaction(async tx => {
    // Update prompt fields
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description
    await tx.prompt.update({ where: { id }, data })

    // Replace messages if provided
    if (messages !== undefined) {
      await tx.promptMessage.deleteMany({ where: { promptId: id } })
      if (messages.length) {
        await tx.promptMessage.createMany({
          data: (messages as { role: string; content: string }[]).map((m, i) => ({
            promptId: id,
            role: m.role,
            content: m.content,
            order: i,
          })),
        })
      }
    }
  })

  const prompt = await prisma.prompt.findFirst({ where: { id }, include })
  dispatchWebhook(userId, 'prompt.updated', prompt).catch(() => {})
  return NextResponse.json(prompt)
})

export const DELETE = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const existing = await prisma.prompt.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.prompt.delete({ where: { id } })
  dispatchWebhook(userId, 'prompt.deleted', { id, name: existing.name }).catch(() => {})
  return NextResponse.json({ ok: true })
})
