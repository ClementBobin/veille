import crypto from 'crypto'
import { prisma } from './prisma'
import { WebhookDeliveryResult } from '@/types';

function parseEvents(events: string): string[] {
  return events.split(',').map(e => e.trim()).filter(Boolean)
}

async function deliver(webhook: { id: string; name: string; url: string; secret: string | null }, event: string, data: unknown): Promise<WebhookDeliveryResult> {
  try {
    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data,
    })

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (webhook.secret) {
      const signature = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex')
      headers['X-Veille-Signature'] = `sha256=${signature}`
    }

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(5000),
    })

    return { webhookId: webhook.id, name: webhook.name, ok: res.ok, status: res.status }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown webhook error'
    return { webhookId: webhook.id, name: webhook.name, ok: false, error: message }
  }
}

/**
 * Fans an event out to every active webhook the user has configured that is
 * subscribed to it (e.g. a "api" webhook and a "mobile" webhook can each
 * listen to a different subset of events). Never throws — failures are
 * reported per-webhook in the returned array, and a broken/unreachable
 * webhook never breaks the request that triggered it.
 */
export async function dispatchWebhook(userId: string, event: string, data: unknown): Promise<WebhookDeliveryResult[]> {
  const webhooks = await prisma.webhook.findMany({ where: { userId, active: true } })
  const matching = webhooks.filter(w => parseEvents(w.events).includes(event))
  if (matching.length === 0) return []

  const results = await Promise.all(matching.map(w => deliver(w, event, data)))

  await Promise.all(
    results.map(r =>
      prisma.webhook.update({
        where: { id: r.webhookId },
        data: {
          lastTriggeredAt: new Date(),
          lastStatus: r.ok ? `ok (${r.status})` : `error: ${r.error ?? r.status}`,
        },
      }).catch(() => {}),
    ),
  )

  return results
}

/** Sends a one-off test event to a single webhook, ignoring its event subscriptions. */
export async function sendTestWebhook(userId: string, webhookId: string): Promise<WebhookDeliveryResult | null> {
  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, userId } })
  if (!webhook) return null

  const result = await deliver(webhook, 'test', { message: 'This is a test event from Veille' })

  await prisma.webhook.update({
    where: { id: webhook.id },
    data: {
      lastTriggeredAt: new Date(),
      lastStatus: result.ok ? `ok (${result.status})` : `error: ${result.error ?? result.status}`,
    },
  }).catch(() => {})

  return result
}