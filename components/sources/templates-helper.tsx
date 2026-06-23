import type { SourceTypeTemplate } from '@/hooks/use-source-types'

type TemplatesHelperProps = {
  templates: SourceTypeTemplate[]
  onSelect: (url: string) => void
}

export function TemplatesHelper({ templates, onSelect }: TemplatesHelperProps) {
  if (!templates.length) return null
  return (
    <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
      <div className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">Templates</div>
      <div className="grid grid-cols-2 gap-1.5">
        {templates.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            className="text-left text-[11px] text-zinc-400 hover:text-indigo-300 px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 transition-colors truncate"
            title={t.value}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}