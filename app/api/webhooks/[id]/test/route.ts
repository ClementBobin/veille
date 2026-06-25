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
  console.log(result)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Always 200 — the result carries ok/status/error from the remote end
  return NextResponse.json({
    ok: result.ok,
    status: result.status ?? null,
    error: result.error ?? null,
  })
})