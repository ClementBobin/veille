import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const [tags, sources, digests, notes] = await Promise.all([
    prisma.tag.count(),
    prisma.source.count({ where: { active: true } }),
    prisma.digest.count({ where: { status: 'PENDING' } }),
    prisma.note.count(),
  ])

  const recentNotes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  const recentSources = await prisma.source.findMany({
    orderBy: { lastFetch: 'desc' },
    take: 4,
  })

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

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            <div className="text-xl mb-3">{icon}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs font-medium text-indigo-400 tracking-widest uppercase mb-4">Sources récentes</div>
          {recentSources.length === 0 && (
            <p className="text-zinc-600 text-sm">Aucune source — <Link href="/sources" className="text-indigo-400 underline">en ajouter</Link></p>
          )}
          {recentSources.map((s) => (
            <div key={s.id} className="flex justify-between items-center py-2.5 border-b border-zinc-800 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                <span className="text-sm text-zinc-300">{s.name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{s.type}</span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs font-medium text-purple-400 tracking-widest uppercase mb-4">Notes récentes</div>
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
