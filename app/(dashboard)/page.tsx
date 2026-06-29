'use client'

import { useEffect, useState } from 'react'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { PipelineMonitor } from '@/components/dashboard/pipeline-monitor'
import { RecentSourcesCard } from '@/components/dashboard/recent-sources-card'
import { RecentNotesCard } from '@/components/dashboard/recent-notes-card'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardData = {
  tags: number
  sources: number
  digests: number
  notes: number
  recentNotes: { id: string; title: string; filename: string; createdAt: string }[]
  recentSources: { id: string; name: string; type: string; active: boolean; lastFetch: string | null }[]
  pipelineEvents: { workflow: string; event: { id: string; status: string; message?: string; createdAt: string } | null }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Overview of your tech watch</p>
      </div>

      {loading || !data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-zinc-900 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 bg-zinc-900 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
            <Skeleton className="h-48 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <StatsGrid
            sources={data.sources}
            tags={data.tags}
            digests={data.digests}
            notes={data.notes}
          />
          <PipelineMonitor entries={data.pipelineEvents} />
          <div className="grid grid-cols-2 gap-4">
            <RecentSourcesCard sources={data.recentSources} />
            <RecentNotesCard notes={data.recentNotes} />
          </div>
        </>
      )}
    </div>
  )
}
