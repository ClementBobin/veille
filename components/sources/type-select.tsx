'use client'

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxValue,
} from '@/components/ui/combobox'
import type { SourceTypeMeta } from '@/hooks/use-source-types'

type TypeSelectProps = {
  types: SourceTypeMeta[]
  value: string
  onChange: (v: string) => void
}

// NOTE: this assumes the installed @base-ui/react Combobox.Root accepts
// `items` / `value` / `onValueChange` with the selected item object (not just
// its string value). Adjust prop names here if your version differs.
export function TypeSelect({ types, value, onChange }: TypeSelectProps) {
  const selected = types.find(t => t.value === value) ?? null

  return (
    <Combobox
      items={types}
      value={selected}
      onValueChange={(item: SourceTypeMeta | null) => item && onChange(item.value)}
      itemToStringValue={(item: SourceTypeMeta) => item.label}
    >
      <ComboboxInput placeholder="Type" className="w-48">
        <ComboboxValue>
          {(item: SourceTypeMeta | null) => (item ? `${item.icon}` : 'Type')}
        </ComboboxValue>
      </ComboboxInput>
      <ComboboxContent className='w-full'>
        <ComboboxEmpty>No type found</ComboboxEmpty>
        <ComboboxList>
          {(item: SourceTypeMeta) => (
            <ComboboxItem key={item.value} value={item}>
              {item.icon} {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}