import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Theme } from '@/types'

type ThemeCardProps = {
  theme: Theme
  selected: boolean
  onToggleSelect: () => void
  onToggleActive: () => void
  onEdit: () => void
  onRemove: () => void
}

export function ThemeCard({ theme, selected, onToggleSelect, onToggleActive, onEdit, onRemove }: ThemeCardProps) {
  return (
    <div
      className={`bg-zinc-900 border border-indigo-500/20 rounded-xl p-5 flex items-start gap-4 group ${theme.active ? '' : 'opacity-60'}`}
    >
      <Checkbox checked={selected} onCheckedChange={() => onToggleSelect()} className="mt-0.5" />

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-200">{theme.title}</span>
          {theme.validationCriteria && (
            <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-500/30">
              criteria
            </Badge>
          )}
        </div>

        {theme.description && (
          <div className="text-xs text-zinc-500 leading-relaxed">{theme.description}</div>
        )}

        {theme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {theme.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {theme.validationCriteria && (
          <div className="text-[11px] text-zinc-600 italic mt-1 line-clamp-2">
            {theme.validationCriteria}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleActive}
              className={theme.active ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}
            >
              {theme.active ? 'ON' : 'OFF'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme.active ? 'Disable this theme' : 'Enable this theme'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onEdit} className="text-zinc-700 hover:text-zinc-300 opacity-0 group-hover:opacity-100">
              ✏️
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit theme</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onRemove} className="text-zinc-700 hover:text-red-400 text-lg leading-none">
              ×
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete theme</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}