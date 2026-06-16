import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { digestId, selectedSubjectIds } = await req.json()

  await prisma.subject.updateMany({ where: { digestId }, data: { selected: false } })
  await prisma.subject.updateMany({
    where: { id: { in: selectedSubjectIds }, digestId },
    data: { selected: true },
  })
  await prisma.digest.update({ where: { id: digestId }, data: { status: 'SELECTED' } })

  await prisma.pipelineEvent.create({
    data: { workflow: 'WF4', status: 'done', message: `${selectedSubjectIds.length} sujets sélectionnés` },
  })

  const n8nUrl = process.env.N8N_BASE_URL ?? 'http://localhost:5678'
  const webhookPath = process.env.N8N_WEBHOOK_PATH ?? 'webhook-test'
  try {
    await fetch(`${n8nUrl}/${webhookPath}/start-wf4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ digestId }),
    })
  } catch (err) {
    console.error('[WF5 trigger] Erreur :', err)
  }

  return NextResponse.json({ ok: true, selected: selectedSubjectIds.length })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const digestId = searchParams.get('digestId')

  const digest = await prisma.digest.findFirst({
    where: {
      ...(digestId ? { id: digestId } : {}),
      subjects: { some: { selected: true } },
    },
    include: {
      tags: { include: { tag: true } },
      toc: {
        orderBy: { order: 'asc' },
        include: {
          articles: {
            include: {
              feedItem: {
                include: {
                  tags: { include: { tag: true } },
                },
              },
            },
          },
        },
      },
      subjects: {
        where: { selected: true },
        include: {
          feedItems: {
            include: {
              feedItem: {
                include: {
                  tags: { include: { tag: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!digest) return NextResponse.json(null)

  // Collect all unique articles across selected subjects
  const articlesMap = new Map<string, any>()
  for (const subject of digest.subjects) {
    for (const { feedItem } of subject.feedItems) {
      if (!articlesMap.has(feedItem.id)) {
        articlesMap.set(feedItem.id, feedItem)
      }
    }
  }

  // Build tocIds per article
  const articleTocIds = new Map<string, string[]>()
  for (const tocEntry of digest.toc) {
    for (const { feedItemId } of tocEntry.articles) {
      if (!articleTocIds.has(feedItemId)) articleTocIds.set(feedItemId, [])
      articleTocIds.get(feedItemId)!.push(tocEntry.id)
    }
  }

  const result = {
    id: digest.id,
    title: digest.title,
    summary: digest.summary,
    tags: digest.tags.map((t) => t.tag.name),
    toc: digest.toc.map((t) => ({
      id: t.id,
      order: t.order,
      title: t.title,
      summary: t.summary,
    })),
    articles: [...articlesMap.values()].map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      content: a.content,
      tags: a.tags.map((t: any) => t.tag.name),
      tocIds: articleTocIds.get(a.id) ?? [],
    })),
  }

  return NextResponse.json(result)
}