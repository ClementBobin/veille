import { Badge } from '@/components/ui/badge'
import { BadgeOverflow } from '@/components/ui/badge-overflow'
import type { Note } from '@/types'
import { toArray } from '@/lib/utils'

type NoteListItemProps = {
  note: Note
  onClick: () => void
}

export function NoteListItem({ note, onClick }: NoteListItemProps) {
  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-zinc-700 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0">📄</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-zinc-200">{note.title}</div>
        <div className="text-xs text-zinc-600 font-mono mt-0.5">{note.filename}</div>
      </div>
      <BadgeOverflow
        items={toArray(note.exportedTo)}
        lineCount={1}
        className="w-32 justify-end flex-shrink-0"
        renderBadge={(item) => <Badge variant="outline" className="text-zinc-500">{item}</Badge>}
      />
      <div className="text-xs text-zinc-600 flex-shrink-0">
        {new Date(note.createdAt).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}