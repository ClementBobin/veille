import crypto from 'crypto'
import { prisma } from './prisma'
import { subscriberMatchesEvent, parseSubscriptions } from './webhook-events'

export type WebhookDeliveryResult = {
  webhookId: string
  name: string
  ok: boolean
  status?: number
  error?: string
}

async function deliver(
  userId: string,
  webhook: { id: string; name: string; url: string; secret: string | null },
  event: string,
  data: unknown,
  isTest = false,
): Promise<WebhookDeliveryResult> {
  const start = Date.now()
  let ok = false
  let status: number | undefined
  let errorMsg: string | undefined

  try {
    const payload = JSON.stringify({ event, timestamp: new Date().toISOString(), data })
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (webhook.secret) {
      const sig = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex')
      headers['X-Veille-Signature'] = `sha256=${sig}`
    }
    const res = await fetch(webhook.url, {
      method: 'POST', headers, body: payload,
      signal: AbortSignal.timeout(5000),
    })
    ok = res.ok
    status = res.status
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Unknown webhook error'
  }

  const durationMs = Date.now() - start
  const path = `/webhook/${webhook.id}/${event}${isTest ? '?test=1' : ''}`
  prisma.log.create({
    data: {
      userId, method: 'POST', path, status: status ?? 0,
      durationMs, authType: 'webhook', error: errorMsg ?? null, type: 'webhook',
    },
  }).catch(() => {})

  return { webhookId: webhook.id, name: webhook.name, ok, status, error: errorMsg }
}

/**
 * Dispatches an event to every active webhook that has the matching scope.
 * The `events` column stores comma-separated scope values.
 * Never throws — fire-and-forget safe.
 */
export async function dispatchWebhook(
  userId: string,
  event: string,
  data: unknown,
): Promise<WebhookDeliveryResult[]> {
  const webhooks = await prisma.webhook.findMany({ where: { userId, active: true } })
  const matching = webhooks.filter(w =>
    subscriberMatchesEvent(parseSubscriptions(w.events), event)
  )
  if (matching.length === 0) return []

  const results = await Promise.all(matching.map(w => deliver(userId, w, event, data, false)))

  await Promise.all(
    results.map(r =>
      prisma.webhook.update({
        where: { id: r.webhookId },
        data: {
          lastTriggeredAt: new Date(),
          lastStatus: r.ok ? `ok (${r.status})` : `error: ${r.error ?? r.status}`,
        },
      }).catch(() => {})
    )
  )

  return results
}

/** Sends a test event to a single webhook regardless of its scope subscriptions. */
export async function sendTestWebhook(
  userId: string,
  webhookId: string,
): Promise<WebhookDeliveryResult | null> {
  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, userId } })
  if (!webhook) return null

  const result = await deliver(userId, webhook, 'test', {
    message: 'This is a test event from Veille',
    scopes: webhook.events,
  }, true)

  await prisma.webhook.update({
    where: { id: webhook.id },
    data: {
      lastTriggeredAt: new Date(),
      lastStatus: result.ok ? `ok (${result.status})` : `error: ${result.error ?? result.status}`,
    },
  }).catch(() => {})

  return result
}
