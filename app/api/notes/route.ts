import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { dispatchWebhook } from '@/lib/webhook'

export const POST = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { title, content, digestId, filename, exportedTo } = await req.json()

  if (digestId) {
    const digest = await prisma.digest.findFirst({ where: { id: digestId, userId } })
    if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
  }

  const note = await prisma.note.create({
    data: {
      title,
      content,
      digestId,
      filename,
      userId,
      exportedTo: Array.isArray(exportedTo) ? exportedTo.join(',') : (exportedTo ?? ''),
    },
  })

  if (digestId) await prisma.digest.update({ where: { id: digestId }, data: { status: 'DONE' } })

  // Notify the configured webhook every time a note is posted.
  dispatchWebhook(userId, 'note.created', note).catch(() => {})

  return NextResponse.json(note, { status: 201 })
})

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const paginate = searchParams.has('page') || searchParams.has('limit')

  const where = {
    userId,
    ...(search
      ? { OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ]}
      : {}),
  }

  if (!paginate) {
    const notes = await prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(notes)
  }

  const [total, notes] = await Promise.all([
    prisma.note.count({ where }),
    prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, title: true, filename: true, exportedTo: true, createdAt: true, digestId: true },
    }),
  ])

  return NextResponse.json({ notes, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit })
})