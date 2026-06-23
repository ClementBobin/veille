import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

type Source = { id: string; name: string; type: string; active: boolean }

export function RecentSourcesCard({ sources }: { sources: Source[] }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent>
        <div className="text-xs font-medium text-indigo-400 tracking-widest uppercase mb-4">
          Recent sources
        </div>
        {sources.length === 0 && (
          <p className="text-zinc-600 text-sm">
            No sources yet —{' '}
            <Link href="/sources" className="text-indigo-400 underline">add one</Link>
          </p>
        )}
        {sources.map((s) => (
          <div key={s.id} className="flex justify-between items-center py-2.5 border-b border-zinc-800 last:border-0">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              <span className="text-sm text-zinc-300">{s.name}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{s.type}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}