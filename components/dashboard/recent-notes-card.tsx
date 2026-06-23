import { Card, CardContent } from '@/components/ui/card'

type Note = { id: string; title: string; filename: string }

export function RecentNotesCard({ notes }: { notes: Note[] }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent>
        <div className="text-xs font-medium text-purple-400 tracking-widest uppercase mb-4">
          Recent notes
        </div>
        {notes.length === 0 && (
          <p className="text-zinc-600 text-sm">No notes generated yet.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="py-2.5 border-b border-zinc-800 last:border-0">
            <div className="text-sm text-zinc-300">{n.title}</div>
            <div className="text-xs text-zinc-600 mt-0.5 font-mono">{n.filename}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}