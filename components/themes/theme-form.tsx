'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CategoryPicker, type CategoryOption } from '@/components/categories/category-picker'
import { TagPicker, type TagOption } from '@/components/tags/tag-picker'

export type ThemeFormState = {
  title: string
  description: string
  tags: TagOption[]       // real Tag objects from the DB
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
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-zinc-500 mb-1.5 block">Title *</Label>
          <Input
            value={form.title}
            onChange={e => onFormChange({ ...form, title: e.target.value })}
            placeholder="e.g. AI & Machine Learning"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-500 mb-1.5 block">Description</Label>
          <Input
            value={form.description}
            onChange={e => onFormChange({ ...form, description: e.target.value })}
            placeholder="Short description"
          />
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
        <Label className="text-xs text-zinc-500 mb-1.5 block">Tags</Label>
        <p className="text-[11px] text-zinc-600 mb-2">
          Link existing tags — these are passed to the LLM during categorization.
        </p>
        <TagPicker
          value={form.tags}
          onChange={tags => onFormChange({ ...form, tags })}
          placeholder="Search and add tags…"
        />
      </div>

      <div>
        <Label className="text-xs text-zinc-500 mb-1.5 block">Categories</Label>
        <CategoryPicker
          value={form.categories}
          onChange={cats => onFormChange({ ...form, categories: cats })}
        />
      </div>

      <Label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
        <Checkbox
          checked={form.active}
          onCheckedChange={v => onFormChange({ ...form, active: !!v })}
        />
        Active — used by the categorization pipeline
      </Label>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.title.trim()}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
