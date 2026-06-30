import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import ObsidianRenderer from '@/components/ui/ObsidianRenderer'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { id } = await params
  const note = await prisma.note.findFirst({ where: { id, userId } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Dynamically imported (rather than statically) to avoid Next/Turbopack's
  // build-time warning about importing react-dom/server outside a Server
  // Component — this is a route handler rendering to a static HTML string
  // for download, not a page render, so the warning doesn't apply.
  const { renderToStaticMarkup } = await import('react-dom/server')

  const element = await ObsidianRenderer({ content: note.content })
  const html = renderToStaticMarkup(element)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
})