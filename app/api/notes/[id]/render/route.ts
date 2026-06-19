import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { renderToStaticMarkup } from 'react-dom/server'
import ObsidianRenderer from '@/components/ui/ObsidianRenderer'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const note = await prisma.note.findFirst({ where: { id, userId } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const element = await ObsidianRenderer({ content: note.content })
  const html = renderToStaticMarkup(element)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
})