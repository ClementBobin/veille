'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import { LabeledInput } from './labeled-field'
import type { Config } from '@/types'

type WebhookCardProps = {
  draft: Config
  onDraftChange: (config: Config) => void
  changed: boolean
  saving: boolean
  saved: boolean
  onSave: () => void
}

export function WebhookCard({ draft, onDraftChange, changed, saving, saved, onSave }: WebhookCardProps) {
  const [testing, setTesting] = useState(false)

  const sendTest = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/system/webhook-test', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error === 'no-webhook-configured' ? 'Set a webhook URL first' : (data.error ?? 'Test failed'))
        return
      }
      toast.success('Test event sent')
    } finally {
      setTesting(false)
    }
  }

  return (
    <SectionCard title="Webhook" accent="text-amber-400">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-zinc-500 -mt-1">
          Get notified for every pipeline-event and whenever a note is posted. We&apos;ll POST a JSON
          payload (<code className="text-zinc-400">event</code>, <code className="text-zinc-400">data</code>, …)
          to this URL.
        </p>
        <LabeledInput
          label="Webhook URL"
          hint="Where to send pipeline-event and note.created notifications"
          value={draft.WEBHOOK_URL ?? ''}
          onChange={v => onDraftChange({ ...draft, WEBHOOK_URL: v })}
          placeholder="https://example.com/webhooks/veille"
        />
        <LabeledInput
          label="Webhook secret"
          hint="Optional — used to sign payloads with X-Veille-Signature (HMAC SHA-256)"
          value={draft.WEBHOOK_SECRET ?? ''}
          onChange={v => onDraftChange({ ...draft, WEBHOOK_SECRET: v })}
          placeholder="••••••••"
          type="password"
        />
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={onSave} disabled={!changed || saving}>
            {saving && <Spinner className="mr-1" />}
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="outline" onClick={sendTest} disabled={testing}>
            {testing && <Spinner className="mr-1" />}
            {testing ? 'Sending…' : 'Send test event'}
          </Button>
          {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
          {!changed && !saved && <span className="text-xs text-zinc-600">No changes</span>}
        </div>
      </div>
    </SectionCard>
  )
}