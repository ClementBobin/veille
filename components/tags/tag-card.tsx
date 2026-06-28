import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Tag } from '@/types'
import type { CategoryOption } from '@/components/categories/category-picker'

type TagCardProps = {
  tag: Tag & { categories?: { category: CategoryOption }[] }
  selected: boolean
  onToggleSelect: () => void
  onToggleActive: () => void
  onEdit: () => void
  onRemove: () => void
}

export function TagCard({ tag, selected, onToggleSelect, onToggleActive, onEdit, onRemove }: TagCardProps) {
  const cats = tag.categories?.map(c => c.category) ?? []

  return (
    <div
      style={{ borderColor: tag.color + '33' }}
      className={`bg-zinc-900 border rounded-xl p-5 flex items-center gap-4 group ${tag.active ? '' : 'opacity-60'}`}
    >
      <Checkbox checked={selected} onCheckedChange={() => onToggleSelect()} />

      <div style={{
        background: tag.color + '22', width: 40, height: 40, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: tag.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-200">{tag.name}</span>
          {cats.map(cat => (
            <span
              key={cat.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
              style={{ borderColor: cat.color + '55', background: cat.color + '18', color: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
        <div className="text-xs text-zinc-600 mt-0.5 truncate">
          {tag.description || 'No description'}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm" variant="ghost" onClick={onToggleActive}
            className={tag.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}
          >
            {tag.active ? 'ON' : 'OFF'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tag.active ? 'Disable this tag' : 'Enable this tag'}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" onClick={onEdit} className="text-zinc-700 hover:text-zinc-300 opacity-0 group-hover:opacity-100">✏️</Button>
        </TooltipTrigger>
        <TooltipContent>Edit tag</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" onClick={onRemove} className="text-zinc-700 hover:text-red-400 text-lg leading-none">×</Button>
        </TooltipTrigger>
        <TooltipContent>Delete tag</TooltipContent>
      </Tooltip>
    </div>
  )
}