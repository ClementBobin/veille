import { prisma } from '@/lib/prisma'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { PipelineMonitor } from '@/components/dashboard/pipeline-monitor'
import { RecentSourcesCard } from '@/components/dashboard/recent-sources-card'
import { RecentNotesCard } from '@/components/dashboard/recent-notes-card'

export default async function DashboardPage() {
  const [tags, sources, digests, notes] = await Promise.all([
    prisma.tag.count(),
    prisma.source.count({ where: { active: true } }),
    prisma.digest.count({ where: { status: 'PENDING' } }),
    prisma.note.count(),
  ])

  const recentNotes = await prisma.note.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })
  const recentSources = await prisma.source.findMany({ orderBy: { lastFetch: 'desc' }, take: 4 })

  // Pipeline monitoring — latest event per workflow
  const workflows = ['WF1', 'WF2', 'WF3', 'WF4']
  const pipelineEvents = await Promise.all(
    workflows.map(async (wf) => ({
      workflow: wf,
      event: await prisma.pipelineEvent.findFirst({
        where: { workflow: wf },
        orderBy: { createdAt: 'desc' },
      }),
    }))
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Overview of your tech watch</p>
      </div>

      <StatsGrid sources={sources} tags={tags} digests={digests} notes={notes} />

      <PipelineMonitor entries={pipelineEvents} />

      <div className="grid grid-cols-2 gap-4">
        <RecentSourcesCard sources={recentSources} />
        <RecentNotesCard notes={recentNotes} />
      </div>
    </div>
  )
}