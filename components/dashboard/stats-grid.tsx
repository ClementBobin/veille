import { StatCard } from './stat-card'

type StatsGridProps = {
  sources: number
  tags: number
  digests: number
  notes: number
}

export function StatsGrid({ sources, tags, digests, notes }: StatsGridProps) {
  const stats = [
    { label: 'Active sources', value: sources, icon: '📡', color: 'text-indigo-400', href: '/sources' },
    { label: 'Tags defined', value: tags, icon: '🏷️', color: 'text-purple-400', href: '/tags' },
    { label: 'Pending subjects', value: digests, icon: '📬', color: 'text-orange-400', href: '/selection' },
    { label: 'Notes generated', value: notes, icon: '📝', color: 'text-emerald-400', href: '/notes' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {stats.map(s => <StatCard key={s.label} {...s} />)}
    </div>
  )
}