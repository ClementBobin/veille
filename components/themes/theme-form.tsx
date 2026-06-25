'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputList,
} from '@/components/ui/tags-input'
import type { Theme } from '@/types'

export type ThemeFormState = {
  title: string
  description: string
  tags: string[]
  validationCriteria: string
  active: boolean
}

export const EMPTY_THEME_FORM: ThemeFormState = {
  title: '',
  description: '',
  tags: [],
  validationCriteria: '',
  active: true,
}

type ThemeFormProps = {
  form: ThemeFormState
  onFormChange: (form: ThemeFormState) => void
  onSave: () => void
  onCancel: () => void
  submitLabel?: string
}

export function ThemeForm({ form, onFormChange, onSave, onCancel, submitLabel = 'Save' }: ThemeFormProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Title *</Label>
          <Input
            value={form.title}
            onChange={e => onFormChange({ ...form, title: e.target.value })}
            placeholder="e.g. Artificial Intelligence"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Description</Label>
          <Input
            value={form.description}
            onChange={e => onFormChange({ ...form, description: e.target.value })}
            placeholder="Brief description of this theme"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">
          Tags <span className="text-zinc-600">(press Enter to add)</span>
        </Label>
        <TagsInput
          value={form.tags}
          onValueChange={tags => onFormChange({ ...form, tags })}
          className="w-full"
        >
          <TagsInputList className="min-h-9 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 flex-wrap gap-1.5">
            {form.tags.map(tag => (
              <TagsInputItem
                key={tag}
                value={tag}
                className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5 text-xs"
              >
                {tag}
              </TagsInputItem>
            ))}
            <TagsInputInput
              placeholder="Add tag…"
              className="text-sm flex-1 min-w-24 bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-600"
            />
          </TagsInputList>
        </TagsInput>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">
          Validation criteria <span className="text-zinc-600">(LLM prompt hint for article selection)</span>
        </Label>
        <textarea
          value={form.validationCriteria}
          onChange={e => onFormChange({ ...form, validationCriteria: e.target.value })}
          placeholder="e.g. Include articles about breakthroughs, research papers, or product launches in AI/ML. Exclude opinion pieces and tutorials."
          rows={3}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => onFormChange({ ...form, active: e.target.checked })}
            className="rounded border-zinc-600"
          />
          Active
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.title}>{submitLabel}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export function themeToForm(theme: Theme): ThemeFormState {
  return {
    title: theme.title,
    description: theme.description ?? '',
    tags: theme.tags,
    validationCriteria: theme.validationCriteria ?? '',
    active: theme.active,
  }
}