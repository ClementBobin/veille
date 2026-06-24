'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import { CleanupMode, type CleanupInfo, type CleanupResult } from '@/types/cleanup'

type CleanupCardProps = {
  info: CleanupInfo | null
  result: CleanupResult | null
  loading: boolean
  onRun: (mode: CleanupMode) => void
}

export function CleanupCard({ info, result, loading, onRun }: CleanupCardProps) {
  const isEligible = info && info.eligibleForCleanup > 0

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
        <div className="mb-4 text-xs px-4 py-2 rounded-lg border">
          <span className={result.deleted > 0 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}>
            {result.mode === CleanupMode.DRY_RUN || result.mode === CleanupMode.DRY_RUN_FORCED ? (
              `🔍 Dry run: ${result.count || 0} articles would be deleted (${result.mode} mode)`
            ) : (
              `✓ ${result.deleted} article(s) deleted (${result.mode} mode)`
            )}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onRun(CleanupMode.STANDARD)}
          disabled={loading || !isEligible}
          className="bg-amber-600 hover:bg-amber-500"
        >
          {loading && <Spinner className="mr-1" />}
          {loading ? 'Running…' : 'Run cleanup'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => onRun(CleanupMode.DRY_RUN)}
          disabled={loading}
        >
          Preview
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => onRun(CleanupMode.FORCED)}
          disabled={loading}
        >
          Forced
        </Button>
        
        <Button
          variant="outline"
          className="border-dashed border-zinc-600 text-zinc-400 hover:text-zinc-300"
          onClick={() => onRun(CleanupMode.DRY_RUN_FORCED)}
          disabled={loading}
        >
          Preview forced
        </Button>
      </div>

      {result?.mode === CleanupMode.FORCED && result.deleted > 100 && (
        <div className="mt-3 text-xs text-amber-400/70 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
          ⚠️ {result.deleted} articles deleted in forced mode. This action cannot be undone.
        </div>
      )}
    </SectionCard>
  )
}