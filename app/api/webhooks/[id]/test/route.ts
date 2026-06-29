import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth-context'
import { withLog } from '@/lib/with-log'
import { sendTestWebhook } from '@/lib/webhook'

export const POST = withLog(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth
  const { id } = await params

  const result = await sendTestWebhook(userId, id)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error ?? `status ${result.status}` }, { status: 502 })
  return NextResponse.json({ ok: true })
})
