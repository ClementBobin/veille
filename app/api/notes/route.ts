import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

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

  return NextResponse.json(note, { status: 201 })
})

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const notes = await prisma.note.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(notes)
})