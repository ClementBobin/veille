import { Badge } from '@/components/ui/badge'
import { BadgeOverflow } from '@/components/ui/badge-overflow'
import { toArray } from '@/types'

type NoteDetailHeaderProps = {
  title: string
  filename: string
  exportedTo: string
}

export function NoteDetailHeader({ title, filename, exportedTo }: NoteDetailHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="text-xs text-zinc-600 font-mono mt-1">{filename}</div>
      </div>
      <BadgeOverflow
        items={toArray(exportedTo)}
        lineCount={1}
        className="w-40 justify-end"
        renderBadge={(item) => <Badge variant="outline" className="text-zinc-500">{item}</Badge>}
      />
    </div>
  )
}