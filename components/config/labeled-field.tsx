import { Input } from '@/components/ui/input'

type LabeledInputProps = {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}

export function LabeledInput({ label, hint, value, onChange, placeholder, type = 'text' }: LabeledInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-400 font-medium">{label}</label>
      {hint && <div className="text-[11px] text-zinc-600">{hint}</div>}
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}