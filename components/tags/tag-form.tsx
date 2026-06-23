'use client'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  KeyValue,
  KeyValueList,
  KeyValueItem,
  KeyValueKeyInput,
  KeyValueValueInput,
} from '@/components/ui/key-value'
import {
  ColorPicker,
  ColorPickerTrigger,
  ColorPickerContent,
  ColorPickerArea,
  ColorPickerHueSlider,
  ColorPickerSwatch,
  ColorPickerInput,
} from '@/components/ui/color-picker'

export type TagFormState = { name: string; color: string; description: string }

type TagFormProps = {
  form: TagFormState
  onFormChange: (form: TagFormState) => void
  onSave: () => void
  onCancel: () => void
}

// The tag's name/description pair is modeled as a single fixed KeyValue item
// (key = name, value = description) to reuse the KeyValue component's styled
// inputs without exposing its add/remove-row affordances.
export function TagForm({ form, onFormChange, onSave, onCancel }: TagFormProps) {
  const kvValue = useMemo(
    () => [{ id: 'tag-fields', key: form.name, value: form.description }],
    [form.name, form.description],
  )

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
      <div className="flex items-start gap-3 mb-3">
        <KeyValue
          value={kvValue}
          onValueChange={(items) => {
            const item = items[0]
            if (item) onFormChange({ ...form, name: item.key, description: item.value })
          }}
          keyPlaceholder="Tag name (e.g. AI/ML)"
          valuePlaceholder="Description (helps the LLM)"
          minItems={1}
          maxItems={1}
          className="flex-1"
        >
          <KeyValueList>
            <KeyValueItem>
              <KeyValueKeyInput className="flex-1" />
              <KeyValueValueInput className="flex-1" />
            </KeyValueItem>
          </KeyValueList>
        </KeyValue>

        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Label className="text-xs text-zinc-500">Color</Label>
          <ColorPicker value={form.color} onValueChange={(c) => onFormChange({ ...form, color: c })}>
            <ColorPickerTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 px-0">
                <ColorPickerSwatch />
              </Button>
            </ColorPickerTrigger>
            <ColorPickerContent>
              <ColorPickerArea />
              <ColorPickerHueSlider />
              <ColorPickerInput withoutAlpha />
            </ColorPickerContent>
          </ColorPicker>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={onSave}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}