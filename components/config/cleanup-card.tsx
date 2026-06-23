'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import type { CleanupInfo } from '@/types'

type CleanupCardProps = {
  info: CleanupInfo | null
  result: { deleted: number; cutoff: string } | null
  loading: boolean
  onRun: (dryRun: boolean) => void
}

export function CleanupCard({ info, result, loading, onRun }: CleanupCardProps) {
  return (
    <SectionCard title="Article cleanup" accent="text-amber-400">
      {info && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-950 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-amber-400">{info.eligibleForCleanup}</div>
            <div className="text-xs text-zinc-500">eligible articles</div>
          </div>
          <div className="text-xs text-zinc-600 leading-relaxed">
            Active retention: <span className="text-zinc-400">{info.retentionDays} days</span><br />
            Cutoff: <span className="text-zinc-400">
              {new Date(info.cutoff).toLocaleDateString('en', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {result && (
        <div className="mb-4 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-2">
          ✓ {result.deleted} article(s) deleted
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => onRun(false)}
          disabled={loading || info?.eligibleForCleanup === 0}
          className="bg-amber-600 hover:bg-amber-500"
        >
          {loading && <Spinner className="mr-1" />}
          {loading ? 'Running…' : 'Run cleanup'}
        </Button>
        <Button variant="outline" onClick={() => onRun(true)} disabled={loading}>
          Preview (dry run)
        </Button>
      </div>
    </SectionCard>
  )
}