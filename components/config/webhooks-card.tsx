'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import { BulkActionBar } from '@/components/ui/bulk-action-bar'
import { WebhookRow } from './webhook-row'
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_VALUES } from '@/lib/webhook-events'
import type { Webhook } from '@/types'

const EMPTY_FORM = { name: '', url: '', secret: '', events: [...WEBHOOK_EVENT_VALUES] as string[] }

export function WebhooksCard() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    fetch('/api/webhooks').then(r => r.json()).then(setWebhooks).finally(() => setLoading(false))
  }, [])

  const toggleFormEvent = (value: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(value) ? f.events.filter(e => e !== value) : [...f.events, value],
    }))
  }

  const create = async () => {
    if (!form.name || !form.url) return
    setCreating(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create webhook')
        return
      }
      setWebhooks(prev => [...prev, data])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Webhook created')
    } finally {
      setCreating(false)
    }
  }

  const update = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update webhook')
      return false
    }
    setWebhooks(prev => prev.map(w => (w.id === id ? data : w)))
    return true
  }

  const toggleActive = (w: Webhook) => update(w.id, { active: !w.active })

  const remove = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setSelected(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    toast.success('Webhook deleted')
  }

  const test = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' })
    const data = await res.json()
    if (res.status === 404) {
      toast.error('Webhook not found')
      return false
    }
    if (data.ok) {
      toast.success(`Test sent — remote responded ${data.status}`)
    } else {
      const detail = data.error ? data.error : data.status ? `HTTP ${data.status}` : 'unknown error'
      toast.error(`Test delivered but remote returned: ${detail}`)
    }
    // Refresh the webhook row so lastStatus updates
    fetch('/api/webhooks').then(r => r.json()).then(setWebhooks)
    return data.ok
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkSetActive = async (active: boolean) => {
    if (selected.size === 0) return
    setBulkBusy(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/webhooks/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) {
        toast.error('Bulk update failed')
        return
      }
      setWebhooks(prev => prev.map(w => (selected.has(w.id) ? { ...w, active } : w)))
      toast.success(`${ids.length} webhook(s) ${active ? 'enabled' : 'disabled'}`)
      setSelected(new Set())
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <SectionCard title="Webhooks" accent="text-amber-400">
      <p className="text-xs text-zinc-500 -mt-1 mb-4">
        Add one webhook per destination — e.g. one named &quot;api&quot;, another named &quot;mobile&quot; —
        each can subscribe to its own subset of events. We&apos;ll POST a JSON payload to every active
        webhook subscribed to an event whenever it happens.
      </p>

      {showForm && (
        <div className="flex flex-col gap-3 mb-4 px-3 py-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name (e.g. mobile)" />
            <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/hook" />
          </div>
          <Input
            value={form.secret}
            onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
            placeholder="Secret (optional — signs payloads with X-Veille-Signature)"
            type="password"
          />
          <div className="flex flex-wrap gap-3">
            {WEBHOOK_EVENTS.map(ev => (
              <label key={ev.value} className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                <Checkbox checked={form.events.includes(ev.value)} onCheckedChange={() => toggleFormEvent(ev.value)} />
                {ev.label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={create} disabled={creating || !form.name || !form.url}>
              {creating && <Spinner className="mr-1" />} Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-zinc-500">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="mb-4">
          + Add webhook
        </Button>
      )}

      <BulkActionBar
        count={selected.size}
        busy={bulkBusy}
        onEnable={() => bulkSetActive(true)}
        onDisable={() => bulkSetActive(false)}
        onClear={() => setSelected(new Set())}
      />

      {loading ? (
        <div className="text-xs text-zinc-600 py-4 text-center">Loading…</div>
      ) : webhooks.length === 0 ? (
        <div className="text-xs text-zinc-600 py-4 text-center">No webhooks configured</div>
      ) : (
        <div className="flex flex-col gap-2">
          {webhooks.map(w => (
            <WebhookRow
              key={w.id}
              webhook={w}
              selected={selected.has(w.id)}
              onToggleSelect={() => toggleSelect(w.id)}
              onToggleActive={() => toggleActive(w)}
              onSave={form => update(w.id, { name: form.name, url: form.url, secret: form.secret || undefined, events: form.events })}
              onDelete={() => remove(w.id)}
              onTest={() => test(w.id)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}