'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import type { ImportResult } from '@/types'
import { ArrowDownToLine, FileUp } from 'lucide-react'

type ExportImportCardProps = {
  importing: boolean
  importResult: ImportResult
  importError: string | null
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ExportImportCard({ importing, importResult, importError, onImport }: ExportImportCardProps) {
  return (
    <SectionCard title="Export / Import" accent="text-sky-400">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-300 font-medium mb-1">Export your data</div>
            <div className="text-xs text-zinc-600">
              Download a JSON file containing all your sources, articles, digests and notes.
            </div>
          </div>
          <Button asChild variant='secondary'>
            <a href="/api/system/export" download><ArrowDownToLine /></a>
          </Button>
        </div>

        <div className="border-t border-zinc-800" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-300 font-medium mb-1">Import data</div>
            <div className="text-xs text-zinc-600">
              Merges a JSON export into your account. Existing records are updated.
            </div>
          </div>
          <label
            className={`text-xs font-medium px-1.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0 cursor-pointer ${
              importing ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            {importing ? <span className="inline-flex items-center gap-1.5"><Spinner /> Importing…</span> : <FileUp />}
            <input type="file" accept=".json" className="hidden" onChange={onImport} />
          </label>
        </div>

        {importError && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            ✗ {importError}
          </div>
        )}

        {importResult && (
          <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-2 flex flex-col gap-1">
            <span className="font-medium">✓ Import complete</span>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-emerald-500/80 mt-1">
              {Object.entries(importResult.imported).map(([k, v]) => (
                <span key={k}>{k}: {v}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}