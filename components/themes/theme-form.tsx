'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CategoryPicker, type CategoryOption } from '@/components/categories/category-picker'

export type ThemeFormState = {
  title: string
  description: string
  tags: string[]
  validationCriteria: string
  active: boolean
  categories: CategoryOption[]
}

type ThemeFormProps = {
  form: ThemeFormState
  onFormChange: (f: ThemeFormState) => void
  onSave: () => void
  onCancel: () => void
}

export function ThemeForm({ form, onFormChange, onSave, onCancel }: ThemeFormProps) {
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      onFormChange({ ...form, tags: [...form.tags, t] })
    }
    setTagInput('')
  }

  const removeTag = (t: string) => onFormChange({ ...form, tags: form.tags.filter(x => x !== t) })

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-zinc-500 mb-1.5 block">Title *</Label>
          <Input value={form.title} onChange={e => onFormChange({ ...form, title: e.target.value })} placeholder="e.g. AI & Machine Learning" />
        </div>
        <div>
          <Label className="text-xs text-zinc-500 mb-1.5 block">Description</Label>
          <Input value={form.description} onChange={e => onFormChange({ ...form, description: e.target.value })} placeholder="Short description" />
        </div>
      </div>

      <div>
        <Label className="text-xs text-zinc-500 mb-1.5 block">Validation criteria</Label>
        <Input
          value={form.validationCriteria}
          onChange={e => onFormChange({ ...form, validationCriteria: e.target.value })}
          placeholder="Criteria the LLM uses to judge relevance"
        />
      </div>

      <div>
        <Label className="text-xs text-zinc-500 mb-1.5 block">Keywords / tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="Add keyword and press Enter"
            className="flex-1 h-8 text-xs"
          />
          <Button size="sm" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>Add</Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs text-zinc-500 mb-1.5 block">Categories</Label>
        <CategoryPicker value={form.categories} onChange={cats => onFormChange({ ...form, categories: cats })} />
      </div>

      <Label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
        <Checkbox checked={form.active} onCheckedChange={v => onFormChange({ ...form, active: !!v })} />
        Active — used by the categorization pipeline
      </Label>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.title.trim()}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}