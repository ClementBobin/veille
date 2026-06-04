import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// WF4 (Telegram) or Web UI posts selected subject IDs
export async function POST(req: NextRequest) {
  const { digestId, selectedSubjectIds } = await req.json()

  // Mark subjects as selected/unselected
  await prisma.subject.updateMany({
    where: { digestId },
    data: { selected: false },
  })
  await prisma.subject.updateMany({
    where: { id: { in: selectedSubjectIds }, digestId },
    data: { selected: true },
  })
  await prisma.digest.update({
    where: { id: digestId },
    data: { status: 'SELECTED' },
  })

  return NextResponse.json({ ok: true, selected: selectedSubjectIds.length })
}

// WF5 reads selected subjects to generate the note
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const digestId = searchParams.get('digestId')

  const subjects = await prisma.subject.findMany({
    where: { selected: true, ...(digestId ? { digestId } : {}) },
    include: {
      articles: { include: { article: { include: { source: true } } } },
      digest: true,
    },
  })
  return NextResponse.json(subjects)
}