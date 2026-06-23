import { Card, CardContent } from '@/components/ui/card'

type PipelineEvent = {
  id: string
  workflow: string
  status: string
  message: string | null
  createdAt: Date
}

type PipelineEntry = { workflow: string; event: PipelineEvent | null }

const WF_LABELS: Record<string, string> = {
  WF1: 'Collection',
  WF2: 'Categorization',
  WF3: 'Condensation',
  WF4: 'Note generation',
}

const STATUS_COLOR: Record<string, string> = {
  done: 'text-emerald-400 bg-emerald-400/10',
  started: 'text-amber-400 bg-amber-400/10',
  error: 'text-red-400 bg-red-400/10',
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function PipelineMonitor({ entries }: { entries: PipelineEntry[] }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 mb-4">
      <CardContent>
        <div className="text-xs font-medium text-amber-400 tracking-widest uppercase mb-4">
          n8n pipeline — latest event
        </div>
        <div className="grid grid-cols-4 gap-3">
          {entries.map(({ workflow, event }) => (
            <div key={workflow} className="bg-zinc-950 rounded-lg p-3 text-center">
              <div className="text-xs text-zinc-500 mb-1">{workflow}</div>
              <div className="text-xs font-medium text-zinc-300 mb-2">{WF_LABELS[workflow]}</div>
              {event ? (
                <>
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-1.5 ${STATUS_COLOR[event.status] ?? 'text-zinc-400 bg-zinc-800'}`}>
                    {event.status}
                  </div>
                  <div className="text-xs text-zinc-600">{timeAgo(event.createdAt)}</div>
                  {event.message && (
                    <div className="text-xs text-zinc-700 mt-1 truncate" title={event.message}>
                      {event.message}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-zinc-700">—</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}