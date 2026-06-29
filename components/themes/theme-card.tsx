import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Theme } from '@/types'
import type { CategoryOption } from '@/components/categories/category-picker'

type ThemeWithCats = Theme & { categories?: { category: CategoryOption }[] }

type ThemeCardProps = {
  theme: ThemeWithCats
  onToggleActive: () => void
  onEdit: () => void
  onRemove: () => void
}

export function ThemeCard({ theme, onToggleActive, onEdit, onRemove }: ThemeCardProps) {
  const cats = theme.categories?.map(c => c.category) ?? []
  let tags: string[] = []
  try { tags = JSON.parse(theme.tags) } catch { tags = [] }

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 group ${theme.active ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-zinc-200">{theme.title}</span>
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
          {theme.description && (
            <p className="text-xs text-zinc-500 truncate">{theme.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm" variant="ghost" onClick={onToggleActive}
                className={theme.active
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}
              >
                {theme.active ? 'ON' : 'OFF'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme.active ? 'Disable theme' : 'Enable theme'}</TooltipContent>
          </Tooltip>
          <Button
            size="icon-sm" variant="ghost" onClick={onEdit}
            className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
          >✏️</Button>
          <Button
            size="icon-sm" variant="ghost" onClick={onRemove}
            className="text-zinc-700 hover:text-red-400 text-lg leading-none"
          >×</Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map(t => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {theme.validationCriteria && (
        <p className="text-[11px] text-zinc-600 italic border-t border-zinc-800 pt-2">
          {theme.validationCriteria}
        </p>
      )}
    </div>
  )
}
