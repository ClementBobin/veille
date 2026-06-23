'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { UrlField } from './url-field'
import { TemplatesHelper } from './templates-helper'
import { TypeSelect } from './type-select'
import { getMeta, validateUrl, type SourceTypeMeta } from '@/hooks/use-source-types'
import type { Source } from '@/types'

type SourceEditRowProps = {
  types: SourceTypeMeta[]
  form: Partial<Source>
  onFormChange: (form: Partial<Source>) => void
  showTemplates: boolean
  onShowTemplatesChange: (v: boolean) => void
  onSave: () => void
  onCancel: () => void
}

export function SourceEditRow({
  types, form, onFormChange, showTemplates, onShowTemplatesChange, onSave, onCancel,
}: SourceEditRowProps) {
  const meta = getMeta(types, form.type ?? '')
  const urlError = validateUrl(form.url ?? '', meta)

  return (
    <div className="bg-zinc-900 border border-indigo-600 rounded-xl px-5 py-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Input
          value={form.name ?? ''}
          onChange={e => onFormChange({ ...form, name: e.target.value })}
          placeholder="Name"
        />
        <div className="col-span-2">
          <UrlField value={form.url ?? ''} onChange={url => onFormChange({ ...form, url })} meta={meta} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <TypeSelect
          types={types}
          value={form.type ?? ''}
          onChange={type => { onFormChange({ ...form, type, cache: false }); onShowTemplatesChange(false) }}
        />
        {!!meta?.urlTemplates?.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onShowTemplatesChange(!showTemplates)}
            className="text-indigo-400 hover:text-indigo-300"
          >
            {showTemplates ? '▲ Close' : '▼ Templates'}
          </Button>
        )}
        {meta?.cacheSupported && (
          <Label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none ml-auto">
            <Checkbox checked={form.cache ?? false} onCheckedChange={v => onFormChange({ ...form, cache: !!v })} />
            Cache active
          </Label>
        )}
      </div>
      {showTemplates && !!meta?.urlTemplates?.length && (
        <TemplatesHelper
          templates={meta.urlTemplates}
          onSelect={url => { onFormChange({ ...form, url }); onShowTemplatesChange(false) }}
        />
      )}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={!!urlError}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}