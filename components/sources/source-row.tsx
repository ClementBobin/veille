import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Source } from '@/types'
import type { SourceTypeMeta } from '@/hooks/use-source-types'

type SourceRowProps = {
  source: Source
  meta?: SourceTypeMeta
  selected: boolean
  onToggleSelect: () => void
  onToggleActive: () => void
  onToggleCache: () => void
  onEdit: () => void
  onRemove: () => void
}

export function SourceRow({ source, meta, selected, onToggleSelect, onToggleActive, onToggleCache, onEdit, onRemove }: SourceRowProps) {
  return (
    <div className={`bg-zinc-900 border rounded-xl px-5 py-4 flex items-center gap-4 ${source.active ? 'border-zinc-800' : 'border-zinc-900 opacity-60'}`}>
      <Checkbox checked={selected} onCheckedChange={() => onToggleSelect()} />
      <div className="text-base flex-shrink-0">{meta?.icon ?? '📡'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-zinc-200">{source.name}</span>
          <Badge variant="outline" className={meta?.color ?? 'text-zinc-400 bg-zinc-800'}>
            {meta?.label ?? source.type}
          </Badge>
        </div>
        <div className="text-xs text-zinc-600 font-mono truncate">{source.url}</div>
      </div>

      <div className="text-right text-xs text-zinc-600 flex-shrink-0">
        <div>Last fetch</div>
        <div className="text-zinc-500">
          {source.lastFetch
            ? new Date(source.lastFetch).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Never'}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleActive}
            className={source.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}
          >
            {source.active ? 'ON' : 'OFF'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{source.active ? 'Pause this source' : 'Activate this source'}</TooltipContent>
      </Tooltip>

      {meta?.cacheSupported && (
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
              <Checkbox checked={source.cache} onCheckedChange={() => onToggleCache()} />
              cache
            </label>
          </TooltipTrigger>
          <TooltipContent>Skip items already collected when fetching</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" onClick={onEdit} className="text-zinc-600 hover:text-zinc-300">
            ✏️
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit source</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" onClick={onRemove} className="text-zinc-700 hover:text-red-400 text-lg leading-none">
            ×
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete source</TooltipContent>
      </Tooltip>
    </div>
  )
}