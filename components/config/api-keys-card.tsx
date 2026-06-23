'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { SectionCard } from './section-card'
import type { ApiKey } from '@/types'
import { fmtDate } from '@/lib/utils'

type ApiKeysCardProps = {
  keys: ApiKey[]
  createdKey: string | null
  newKeyName: string
  onNewKeyNameChange: (v: string) => void
  keyLoading: boolean
  onCreate: () => void
  onRevoke: (id: string) => void
}

export function ApiKeysCard({
  keys,
  createdKey,
  newKeyName,
  onNewKeyNameChange,
  keyLoading,
  onCreate,
  onRevoke,
}: ApiKeysCardProps) {
  return (
    <SectionCard title="API keys" accent="text-purple-400">
      {createdKey && (
        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
          <div className="text-xs text-emerald-400 font-medium mb-1">
            ✓ Key created — copy it now, it won&apos;t be shown again
          </div>
          <div className="font-mono text-xs text-emerald-300 break-all bg-zinc-950 px-3 py-2 rounded-md mt-2 select-all">
            {createdKey}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(createdKey) }}
            className="mt-2 text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Copy →
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Input
          value={newKeyName}
          onChange={e => onNewKeyNameChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onCreate()}
          placeholder="Key name (e.g. n8n-prod)"
          className="flex-1"
        />
        <Button onClick={onCreate} disabled={!newKeyName.trim() || keyLoading} variant="default">
          {keyLoading ? <Spinner /> : 'Create'}
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="text-xs text-zinc-600 py-4 text-center">No active API keys</div>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-950 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-200 font-medium">{k.name}</div>
                <div className="text-[11px] text-zinc-600 mt-0.5">
                  Created on {fmtDate(k.createdAt)}
                  {k.lastUsed && <> · Last used {fmtDate(k.lastUsed)}</>}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRevoke(k.id)}
                className="text-zinc-500 hover:border-red-500/50 hover:text-red-400"
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}