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
import {
  WEBHOOK_SCOPES, WEBHOOK_SCOPE_VALUES, ALL_WEBHOOK_EVENTS, parseSubscriptions,
} from '@/lib/webhook-events'
import type { Webhook } from '@/types'

const EMPTY_FORM = { name: '', url: '', secret: '', subscriptions: [...WEBHOOK_SCOPE_VALUES] as string[] }

type PickerMode = 'scope' | 'event'

function SubscriptionPicker({
  value, onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [mode, setMode] = useState<PickerMode>('scope')

  const toggle = (token: string) =>
    onChange(value.includes(token) ? value.filter(s => s !== token) : [...value, token])

  const allScopes = [...WEBHOOK_SCOPE_VALUES]
  const allEvents = ALL_WEBHOOK_EVENTS

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Subscriptions</span>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('scope')}
            className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${mode === 'scope' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-400'}`}
          >
            By scope
          </button>
          <button
            type="button"
            onClick={() => setMode('event')}
            className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${mode === 'event' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-400'}`}
          >
            By event
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(mode === 'scope' ? [...allScopes] : [...allEvents])}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
          >All</button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
          >None</button>
        </div>
      </div>

      {mode === 'scope' ? (
        /* Scope grid — one card per scope */
        <div className="grid grid-cols-2 gap-2">
          {WEBHOOK_SCOPES.map(scope => (
            <label
              key={scope.value}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={value.includes(scope.value)}
                onCheckedChange={() => toggle(scope.value)}
                className="mt-0.5 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-300">{scope.label}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{scope.description}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {scope.events.map(e => (
                    <span key={e} className="text-[9px] font-mono px-1 py-0.5 bg-zinc-800 text-zinc-500 rounded">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        /* Granular event list grouped by scope */
        <div className="flex flex-col gap-3">
          {WEBHOOK_SCOPES.map(scope => (
            <div key={scope.value}>
              <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1.5">
                {scope.label}
              </div>
              <div className="flex flex-col gap-1">
                {scope.events.map(event => (
                  <label key={event}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                    <Checkbox
                      checked={value.includes(event)}
                      onCheckedChange={() => toggle(event)}
                      className="flex-shrink-0"
                    />
                    <span className="text-[11px] font-mono text-zinc-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary of what's selected */}
      {value.length > 0 && (
        <div className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">
          {value.length} subscription{value.length !== 1 ? 's' : ''} active
          {value.some(v => WEBHOOK_SCOPE_VALUES.includes(v as any)) &&
            value.some(v => ALL_WEBHOOK_EVENTS.includes(v)) && (
              <span className="ml-1 text-amber-500/70">
                (mix of scopes and events — a webhook fires if either matches)
              </span>
            )}
        </div>
      )}
    </div>
  )
}

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

  const create = async () => {
    if (!form.name || !form.url) return
    setCreating(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, url: form.url, secret: form.secret,
          scopes: form.subscriptions,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to create webhook'); return }
      setWebhooks(prev => [...prev, data])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Webhook created')
    } finally { setCreating(false) }
  }

  const update = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to update webhook'); return false }
    setWebhooks(prev => prev.map(w => w.id === id ? data : w))
    return true
  }

  const remove = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    toast.success('Webhook deleted')
  }

  const test = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Test failed'); return false }
    toast.success('Test event sent')
    return true
  }

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const bulkSetActive = async (active: boolean) => {
    if (!selected.size) return
    setBulkBusy(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/webhooks/bulk', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) { toast.error('Bulk update failed'); return }
      setWebhooks(prev => prev.map(w => selected.has(w.id) ? { ...w, active } : w))
      toast.success(`${ids.length} webhook(s) ${active ? 'enabled' : 'disabled'}`)
      setSelected(new Set())
    } finally { setBulkBusy(false) }
  }

  return (
    <SectionCard title="Webhooks" accent="text-amber-400">
      <p className="text-xs text-zinc-500 -mt-1 mb-4">
        Subscribe by <strong className="text-zinc-400">scope</strong> to receive all events in that group,
        or switch to <strong className="text-zinc-400">event</strong> mode for granular control.
        A webhook fires if any subscription matches.
      </p>

      {showForm && (
        <div className="flex flex-col gap-4 mb-4 px-4 py-4 bg-zinc-950 rounded-lg border border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name (e.g. mobile)" />
            <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/hook" />
          </div>
          <Input
            value={form.secret}
            onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
            placeholder="Secret (optional — signs with X-Veille-Signature)"
            type="password"
          />
          <SubscriptionPicker
            value={form.subscriptions}
            onChange={subscriptions => setForm(f => ({ ...f, subscriptions }))}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={create} disabled={creating || !form.name || !form.url}>
              {creating && <Spinner className="mr-1" />} Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-zinc-500">Cancel</Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="mb-4">+ Add webhook</Button>
      )}

      <BulkActionBar
        count={selected.size} busy={bulkBusy}
        onEnable={() => bulkSetActive(true)} onDisable={() => bulkSetActive(false)}
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
              key={w.id} webhook={w}
              selected={selected.has(w.id)}
              onToggleSelect={() => toggleSelect(w.id)}
              onToggleActive={() => update(w.id, { active: !w.active })}
              onSave={form => update(w.id, {
                name: form.name, url: form.url,
                secret: form.secret || undefined,
                scopes: form.events,
              })}
              onDelete={() => remove(w.id)}
              onTest={() => test(w.id)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
