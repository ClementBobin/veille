import { prisma } from '@/lib/prisma'
import Link from 'next/link'

type PipelineEntry = {
  workflow: string
  event: {
    id: string
    workflow: string
    status: string
    message: string | null
    createdAt: Date
  } | null
}

const WF_LABELS: Record<string, string> = {
  WF1: 'Collecte',
  WF2: 'Catégorisation',
  WF3: 'Condensation',
  WF4: 'Sélection',
  WF5: 'Génération note',
}

const statusColor: Record<string, string> = {
  done: 'text-emerald-400 bg-emerald-400/10',
  started: 'text-amber-400 bg-amber-400/10',
  error: 'text-red-400 bg-red-400/10',
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  return `il y a ${Math.floor(hrs / 24)}j`
}

export default async function DashboardPage() {
  const [tags, sources, digests, notes] = await Promise.all([
    prisma.tag.count(),
    prisma.source.count({ where: { active: true } }),
    prisma.digest.count({ where: { status: 'PENDING' } }),
    prisma.note.count(),
  ])

  const recentNotes = await prisma.note.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })
  const recentSources = await prisma.source.findMany({ orderBy: { lastFetch: 'desc' }, take: 4 })

  // Pipeline monitoring — dernier event par WF
  const workflows = ['WF1', 'WF2', 'WF3', 'WF4', 'WF5']
  const pipelineEvents: PipelineEntry[] = await Promise.all(
    workflows.map(async (wf) => ({
      workflow: wf,
      event: await prisma.pipelineEvent.findFirst({
        where: { workflow: wf },
        orderBy: { createdAt: 'desc' },
      }),
    }))
  )

  const stats = [
    { label: 'Sources actives', value: sources, icon: '📡', color: 'text-indigo-400', href: '/sources' },
    { label: 'Tags définis', value: tags, icon: '🏷️', color: 'text-purple-400', href: '/tags' },
    { label: 'Sujets en attente', value: digests, icon: '📬', color: 'text-orange-400', href: '/selection' },
    { label: 'Notes générées', value: notes, icon: '📝', color: 'text-emerald-400', href: '/notes' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Vue d'ensemble de ta veille informatique</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
          >
            <div className="text-xl mb-3">{icon}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Pipeline monitoring */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <div className="text-xs font-medium text-amber-400 tracking-widest uppercase mb-4">
          Pipeline n8n — dernier événement
        </div>
        <div className="grid grid-cols-5 gap-3">
          {pipelineEvents.map(({ workflow, event }) => (
            <div key={workflow} className="bg-zinc-950 rounded-lg p-3 text-center">
              <div className="text-xs text-zinc-500 mb-1">{workflow}</div>
              <div className="text-xs font-medium text-zinc-300 mb-2">{WF_LABELS[workflow]}</div>
              {event ? (
                <>
                  <div
                    className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-1.5 ${
                      statusColor[event.status] ?? 'text-zinc-400 bg-zinc-800'
                    }`}
                  >
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sources récentes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs font-medium text-indigo-400 tracking-widest uppercase mb-4">
            Sources récentes
          </div>
          {recentSources.length === 0 && (
            <p className="text-zinc-600 text-sm">
              Aucune source —{' '}
              <Link href="/sources" className="text-indigo-400 underline">en ajouter</Link>
            </p>
          )}
          {recentSources.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center py-2.5 border-b border-zinc-800 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                />
                <span className="text-sm text-zinc-300">{s.name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                {s.type}
              </span>
            </div>
          ))}
        </div>

        {/* Notes récentes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs font-medium text-purple-400 tracking-widest uppercase mb-4">
            Notes récentes
          </div>
          {recentNotes.length === 0 && (
            <p className="text-zinc-600 text-sm">Aucune note générée pour l'instant.</p>
          )}
          {recentNotes.map((n) => (
            <div key={n.id} className="py-2.5 border-b border-zinc-800 last:border-0">
              <div className="text-sm text-zinc-300">{n.title}</div>
              <div className="text-xs text-zinc-600 mt-0.5 font-mono">{n.filename}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
