import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'

export const GET = withLog(async (req: NextRequest, { params }: { params: Promise<{ name: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const prompt = await prisma.prompt.findFirst({
    where: { userId, name: { equals: decodedName, mode: 'insensitive' } },
    include: { messages: { orderBy: { order: 'asc' } } },
  })

  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Return both the full object and a convenience `messages` array
  // shaped for direct use in LLM API calls
  return NextResponse.json({
    ...prompt,
    // LLM-ready shape: just role + content
    llmMessages: prompt.messages.map(m => ({ role: m.role, content: m.content })),
  })
})
