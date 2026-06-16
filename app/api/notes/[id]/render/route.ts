import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiKey } from '@/lib/verifyApiKey'
import { renderToStaticMarkup } from 'react-dom/server'
import ObsidianRenderer from '@/components/ObsidianRenderer'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyApiKey(req)
  if (authError) return authError

  const { id } = await params
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const element = await ObsidianRenderer({ content: note.content })
  const html = renderToStaticMarkup(element)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}