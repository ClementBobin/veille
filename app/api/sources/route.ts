import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Web UI + n8n WF1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forN8n = searchParams.get('for_n8n') === 'true'

  const sources = await prisma.source.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: forN8n ? { feedItems: { take: 1, select: { id: true } } } : undefined,
  })

  if (!forN8n) return NextResponse.json(sources)

  // Pour n8n : filtre les sources dont le cache est actif ET qui ont déjà au moins un feedItem
  const filtered = sources.filter((s: any) => {
    if (!s.cache) return true          // cache=false → toujours envoyer
    return s.feedItems.length === 0    // cache=true  → envoyer seulement si pas encore d'articles
  })

  // On retire le champ feedItems avant de renvoyer
  return NextResponse.json(filtered.map(({ feedItems: _fi, ...s }: any) => s))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, url, type, cache } = body
  if (!name || !url || !type)
    return NextResponse.json({ error: 'name, url, type required' }, { status: 400 })

  const source = await prisma.source.create({
    data: { name, url, type, cache: cache ?? false },
  })
  return NextResponse.json(source, { status: 201 })
}
