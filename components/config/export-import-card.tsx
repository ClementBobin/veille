'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import type { ImportResult, EntityStats } from '@/types'
import { ArrowDownToLine, FileUp } from 'lucide-react'

type ExportImportCardProps = {
  importing: boolean
  importResult: ImportResult
  importError: string | null
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function StatsBadge({ stats }: { stats: EntityStats }) {
  const parts: { label: string; color: string; value: number }[] = [
    { label: 'new', color: 'text-emerald-400', value: stats.created },
    { label: 'updated', color: 'text-amber-400', value: stats.updated },
    { label: 'skip', color: 'text-zinc-500', value: stats.skipped },
  ].filter(p => p.value > 0)

  if (parts.length === 0) return <span className="text-zinc-600">—</span>

  return (
    <span className="flex gap-1.5">
      {parts.map(p => (
        <span key={p.label} className={p.color}>
          +{p.value} {p.label}
        </span>
      ))}
    </span>
  )
}

export function ExportImportCard({ importing, importResult, importError, onImport }: ExportImportCardProps) {
  return (
    <SectionCard title="Export / Import" accent="text-sky-400">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-300 font-medium mb-1">Export your data</div>
            <div className="text-xs text-zinc-600">
              Download a JSON file with all your sources, articles, digests, notes, webhooks and themes.
            </div>
          </div>
          <Button asChild variant="secondary">
            <a href="/api/system/export" download><ArrowDownToLine /></a>
          </Button>
        </div>

        <div className="border-t border-zinc-800" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-300 font-medium mb-1">Import data</div>
            <div className="text-xs text-zinc-600">
              Merges a JSON export into your account. Existing records are updated if changed, skipped if identical.
            </div>
          </div>
          <label
            className={`text-xs font-medium px-1.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0 cursor-pointer ${
              importing ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            {importing ? (
              <span className="inline-flex items-center gap-1.5"><Spinner /> Importing…</span>
            ) : (
              <FileUp />
            )}
            <input type="file" accept=".json" className="hidden" onChange={onImport} />
          </label>
        </div>

        {importError && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            ✗ {importError}
          </div>
        )}

        {importResult && (
          <div className="text-xs bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3 flex flex-col gap-2">
            <span className="font-medium text-emerald-400">✓ Import complete</span>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-0.5">
              {Object.entries(importResult.imported)
                .filter(([, s]) => s.created + s.updated + s.skipped > 0)
                .map(([entity, stats]) => (
                  <>
                    <span key={`${entity}-label`} className="text-zinc-500">{entity}</span>
                    <StatsBadge key={`${entity}-stats`} stats={stats} />
                  </>
                ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
