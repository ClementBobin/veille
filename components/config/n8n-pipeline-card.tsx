'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import { LabeledInput } from './labeled-field'
import type { Config } from '@/types'

type N8nPipelineCardProps = {
  draft: Config
  onDraftChange: (config: Config) => void
  changed: boolean
  saving: boolean
  saved: boolean
  onSave: () => void
}

export function N8nPipelineCard({ draft, onDraftChange, changed, saving, saved, onSave }: N8nPipelineCardProps) {
  return (
    <SectionCard title="n8n pipeline" accent="text-indigo-400">
      <div className="flex flex-col gap-4">
        <LabeledInput
          label="n8n base URL"
          hint="Address of your n8n instance"
          value={draft.N8N_BASE_URL ?? ''}
          onChange={v => onDraftChange({ ...draft, N8N_BASE_URL: v })}
          placeholder="http://localhost:5678"
        />
        <LabeledInput
          label="Webhook path"
          hint="Segment after the base URL (webhook or webhook-test)"
          value={draft.N8N_WEBHOOK_PATH ?? ''}
          onChange={v => onDraftChange({ ...draft, N8N_WEBHOOK_PATH: v })}
          placeholder="webhook-test"
        />
        <LabeledInput
          label="Article retention (days)"
          hint="Articles older than this will be eligible for cleanup"
          value={draft.RETENTION_DAYS ?? ''}
          onChange={v => onDraftChange({ ...draft, RETENTION_DAYS: v })}
          placeholder="7"
          type="number"
        />
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={onSave} disabled={!changed || saving}>
            {saving && <Spinner className="mr-1" />}
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
          {!changed && !saved && <span className="text-xs text-zinc-600">No changes</span>}
        </div>
      </div>
    </SectionCard>
  )
}