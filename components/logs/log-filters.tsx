import { SearchIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox'

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE']
const AUTH_TYPES = ['session', 'apikey']
const STATUSES = ['200', '201', '400', '401', '403', '404', '500']
const LOG_TYPES = ['request', 'webhook:test', 'webhook:pipeline-event', 'webhook:note.created']

type LogFiltersProps = {
  path: string
  onPathChange: (v: string) => void
  method: string
  onMethodChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  authType: string
  onAuthTypeChange: (v: string) => void
  type: string
  onTypeChange: (v: string) => void
  onRefresh: () => void
}

// NOTE: assumes Combobox.Root supports `items` / `value` / `onValueChange`
// over plain strings. Adjust to match your installed @base-ui/react version
// if the prop names differ.
function StringCombobox({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <Combobox items={options} value={value || null} onValueChange={(v: string | null) => onChange(v ?? '')}>
      <ComboboxInput placeholder={label} showClear className="w-32" />
      <ComboboxContent>
        <ComboboxEmpty>No match</ComboboxEmpty>
        <ComboboxList>
          {(option: string) => <ComboboxItem key={option} value={option}>{option}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function LogFilters({
  path,
  onPathChange,
  method,
  onMethodChange,
  status,
  onStatusChange,
  authType,
  onAuthTypeChange,
  type,
  onTypeChange,
  onRefresh,
}: LogFiltersProps) {
  return (
    <div className="flex gap-3 mb-4 items-center flex-wrap">
      <InputGroup className="flex-1 min-w-40">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={path}
          onChange={e => onPathChange(e.target.value)}
          placeholder="Filter by path…"
        />
      </InputGroup>

      <StringCombobox label="Type" options={LOG_TYPES} value={type} onChange={onTypeChange} />
      <StringCombobox label="Method" options={METHODS} value={method} onChange={onMethodChange} />
      <StringCombobox label="Status" options={STATUSES} value={status} onChange={onStatusChange} />
      <StringCombobox label="Auth" options={AUTH_TYPES} value={authType} onChange={onAuthTypeChange} />

      <Button variant="secondary" size="icon" onClick={onRefresh} className="flex-shrink-0">
        ↻
      </Button>
    </div>
  )
}