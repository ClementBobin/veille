'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { UrlField } from './url-field'
import { TemplatesHelper } from './templates-helper'
import { TypeSelect } from './type-select'
import { getMeta, validateUrl, type SourceTypeMeta } from '@/hooks/use-source-types'
import { CategoryPicker, type CategoryOption } from '@/components/categories/category-picker'

export type SourceFormState = { name: string; url: string; type: string; cache: boolean; categories: CategoryOption[] }

type SourceFormProps = {
  types: SourceTypeMeta[]
  form: SourceFormState
  onFormChange: (form: SourceFormState) => void
  showTemplates: boolean
  onShowTemplatesChange: (v: boolean) => void
  onSave: () => void
  onCancel: () => void
}

export function SourceForm({ types, form, onFormChange, showTemplates, onShowTemplatesChange, onSave, onCancel }: SourceFormProps) {
  const meta = getMeta(types, form.type)
  const urlError = validateUrl(form.url, meta)

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Input value={form.name} onChange={e => onFormChange({ ...form, name: e.target.value })} placeholder="Name" />
        <div className="col-span-2">
          <UrlField value={form.url} onChange={url => onFormChange({ ...form, url })} meta={meta} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TypeSelect
          types={types} value={form.type}
          onChange={type => { onFormChange({ ...form, type, url: '', cache: false }); onShowTemplatesChange(false) }}
        />
        {!!meta?.urlTemplates?.length && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onShowTemplatesChange(!showTemplates)} className="text-indigo-400 hover:text-indigo-300">
            {showTemplates ? '▲ Close' : '▼ Templates'}
          </Button>
        )}
        {meta?.cacheSupported && (
          <Label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none ml-auto">
            <Checkbox checked={form.cache} onCheckedChange={v => onFormChange({ ...form, cache: !!v })} />
            Cache — skip if already collected
          </Label>
        )}
      </div>

      {showTemplates && !!meta?.urlTemplates?.length && (
        <TemplatesHelper templates={meta.urlTemplates} onSelect={url => { onFormChange({ ...form, url }); onShowTemplatesChange(false) }} />
      )}

      <div>
        <Label className="text-xs text-zinc-500 mb-1.5 block">Categories</Label>
        <CategoryPicker value={form.categories} onChange={cats => onFormChange({ ...form, categories: cats })} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.name || !form.url || !!urlError}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
