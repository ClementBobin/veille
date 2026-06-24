import { Button } from '@/components/ui/button'

type BulkActionBarProps = {
  count: number
  onEnable: () => void
  onDisable: () => void
  onClear: () => void
  busy?: boolean
}

export function BulkActionBar({ count, onEnable, onDisable, onClear, busy }: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 mb-3">
      <span className="text-xs text-zinc-400">{count} selected</span>
      <div className="flex-1" />
      <Button size="sm" variant="ghost" disabled={busy} onClick={onEnable} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
        Enable
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onDisable} className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700">
        Disable
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onClear} className="text-zinc-600 hover:text-zinc-300">
        Clear
      </Button>
    </div>
  )
}