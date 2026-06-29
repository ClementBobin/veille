'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { WEBHOOK_SCOPES, WEBHOOK_SCOPE_VALUES, parseScopes } from '@/lib/webhook-events'
import { fmtDate } from '@/lib/utils'
import type { Webhook, WebhookLog } from '@/types'

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

function ScopeToggle({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (scope: string) =>
    onChange(value.includes(scope) ? value.filter(s => s !== scope) : [...value, scope])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Scopes</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange([...WEBHOOK_SCOPE_VALUES])}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 underline">All</button>
          <button type="button" onClick={() => onChange([])}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 underline">None</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {WEBHOOK_SCOPES.map(scope => (
          <label key={scope.value}
            className="flex items-start gap-1.5 p-2 rounded border border-zinc-800 hover:border-zinc-700 cursor-pointer text-[11px]">
            <Checkbox
              checked={value.includes(scope.value)}
              onCheckedChange={() => toggle(scope.value)}
              className="mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="text-zinc-300 font-medium">{scope.label}</div>
              <div className="text-zinc-600 text-[10px]">{scope.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export function WebhookRow({ webhook, selected, onToggleSelect, onToggleActive, onSave, onDelete, onTest }: WebhookRowProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null)
  const [form, setForm] = useState<WebhookEditForm>({
    name: webhook.name,
    url: webhook.url,
    secret: '',
    events: parseScopes(webhook.events),
  })

  const activeScopes = parseScopes(webhook.events)

  const save = async () => {
    setSaving(true)
    try {
      const ok = await onSave(form)
      if (ok) setEditing(false)
    } finally { setSaving(false) }
  }

  const test = async () => {
    setTesting(true)
    try {
      const ok = await onTest()
      if (ok && showLogs) fetchLogs()
    } finally { setTesting(false) }
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/system/webhooks/${webhook.id}/logs`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setDbAvailable(data.dbAvailable ?? true)
    } finally { setLogsLoading(false) }
  }

  const toggleLogs = () => {
    if (!showLogs) fetchLogs()
    setShowLogs(v => !v)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 px-3 py-3 bg-zinc-950 rounded-lg border border-zinc-800">
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
          <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL" />
        </div>
        <Input
          value={form.secret}
          onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
          placeholder="New secret (leave blank to keep current)"
          type="password"
        />
        <ScopeToggle value={form.events} onChange={events => setForm(f => ({ ...f, events }))} />
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !form.name || !form.url}>
            {saving && <Spinner className="mr-1" />} Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-zinc-500">Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col bg-zinc-950 rounded-lg border border-zinc-800 ${webhook.active ? '' : 'opacity-60'}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelect()} />
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${webhook.active ? 'bg-amber-500' : 'bg-zinc-600'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-zinc-200 font-medium">{webhook.name}</span>
            {activeScopes.map(s => {
              const meta = WEBHOOK_SCOPES.find(sc => sc.value === s)
              return (
                <Badge key={s} variant="outline" className="text-[10px] text-zinc-500">
                  {meta?.label ?? s}
                </Badge>
              )
            })}
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
            <Button size="sm" variant="ghost" onClick={onToggleActive}
              className={webhook.active
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}>
              {webhook.active ? 'ON' : 'OFF'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{webhook.active ? 'Disable' : 'Enable'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={test} disabled={testing}>
              {testing && <Spinner className="mr-1" />} Test
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send a test event</TooltipContent>
        </Tooltip>

        <Button size="sm" variant="ghost" onClick={toggleLogs}
          className={`text-zinc-500 hover:text-zinc-300 font-mono text-xs ${showLogs ? 'text-zinc-300' : ''}`}>
          Logs
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-zinc-500 hover:text-zinc-300">Edit</Button>
        <Button size="sm" variant="destructive" onClick={onDelete} className="text-zinc-500 hover:border-red-500/50 hover:text-red-400">Delete</Button>
      </div>

      {/* Logs panel */}
      {showLogs && (
        <div className="border-t border-zinc-800 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Delivery logs</span>
            <Button size="sm" variant="ghost" onClick={fetchLogs} disabled={logsLoading}
              className="text-[11px] text-zinc-600 h-5 px-2">
              {logsLoading ? <Spinner className="w-3 h-3" /> : '↻ Refresh'}
            </Button>
          </div>

          {dbAvailable === false && (
            <div className="text-[11px] text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5 mb-2">
              Database not available — logs will appear once the DB is connected and migrated.
            </div>
          )}

          {logsLoading ? (
            <div className="text-[11px] text-zinc-600 py-2 text-center">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-[11px] text-zinc-600 py-2 text-center">No deliveries yet — click Test to send one.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className={`w-12 text-center rounded px-1 py-0.5 ${log.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {log.ok ? (log.status ?? 'ok') : (log.status ?? 'err')}
                  </span>
                  {log.isTest && <span className="text-amber-500/70 border border-amber-500/30 rounded px-1">test</span>}
                  <span className="text-zinc-500">{log.event}</span>
                  {log.durationMs != null && <span className="text-zinc-700">{log.durationMs}ms</span>}
                  {log.error && <span className="text-red-400/80 truncate flex-1">{log.error}</span>}
                  <span className="text-zinc-700 ml-auto">{fmtDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
