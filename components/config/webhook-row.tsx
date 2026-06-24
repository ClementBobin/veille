import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { WEBHOOK_EVENTS } from '@/lib/webhook-events'
import { fmtDate } from '@/lib/utils'
import type { Webhook } from '@/types'

type WebhookEditForm = { name: string; url: string; secret: string; events: string[] }

type WebhookRowProps = {
  webhook: Webhook
  selected: boolean
  onToggleSelect: () => void
  onToggleActive: () => void
  onSave: (form: WebhookEditForm) => Promise<boolean>
  onDelete: () => void
  onTest: () => Promise<boolean>
}

export function WebhookRow({ webhook, selected, onToggleSelect, onToggleActive, onSave, onDelete, onTest }: WebhookRowProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [form, setForm] = useState<WebhookEditForm>({
    name: webhook.name,
    url: webhook.url,
    secret: '',
    events: webhook.events.split(',').filter(Boolean),
  })

  const toggleEvent = (value: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(value) ? f.events.filter(e => e !== value) : [...f.events, value],
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const ok = await onSave(form)
      if (ok) setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      await onTest()
    } finally {
      setTesting(false)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 px-3 py-3 bg-zinc-950 rounded-lg border border-zinc-800">
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name (e.g. mobile)" />
          <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/hook" />
        </div>
        <Input
          value={form.secret}
          onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
          placeholder="New secret (leave blank to keep current)"
          type="password"
        />
        <div className="flex flex-wrap gap-3">
          {WEBHOOK_EVENTS.map(ev => (
            <label key={ev.value} className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <Checkbox checked={form.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} />
              {ev.label}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !form.name || !form.url}>
            {saving && <Spinner className="mr-1" />} Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-zinc-500">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const activeEvents = webhook.events.split(',').filter(Boolean)

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 bg-zinc-950 rounded-lg ${webhook.active ? '' : 'opacity-60'}`}>
      <Checkbox checked={selected} onCheckedChange={() => onToggleSelect()} />
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${webhook.active ? 'bg-amber-500' : 'bg-zinc-600'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-200 font-medium">{webhook.name}</span>
          {activeEvents.map(e => (
            <Badge key={e} variant="outline" className="text-[10px] text-zinc-500">
              {WEBHOOK_EVENTS.find(w => w.value === e)?.label ?? e}
            </Badge>
          ))}
        </div>
        <div className="text-[11px] text-zinc-600 mt-0.5 truncate font-mono">{webhook.url}</div>
        <div className="text-[11px] text-zinc-600 mt-0.5">
          {webhook.lastTriggeredAt
            ? <>Last triggered {fmtDate(webhook.lastTriggeredAt)} · {webhook.lastStatus}</>
            : 'Never triggered'}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleActive}
            className={webhook.active ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}
          >
            {webhook.active ? 'ON' : 'OFF'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{webhook.active ? 'Disable this webhook' : 'Enable this webhook'}</TooltipContent>
      </Tooltip>

      <Button size="sm" variant="outline" onClick={test} disabled={testing}>
        {testing && <Spinner className="mr-1" />} Test
      </Button>

      <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-zinc-500 hover:text-zinc-300">
        Edit
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
        className="text-zinc-500 hover:border-red-500/50 hover:text-red-400"
      >
        Delete
      </Button>
    </div>
  )
}