import { Button } from '@/components/ui/button'
import type { Log } from '@/types'
import { statusColor, methodColor, durationColor } from '@/lib/utils'

type LogDetailProps = {
  log: Log
  onClose: () => void
}

export function LogDetail({ log, onClose }: LogDetailProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono font-bold text-sm ${methodColor(log.method)}`}>{log.method}</span>
            <span className="font-mono text-sm text-zinc-200">{log.path}</span>
          </div>
          <div className="text-xs text-zinc-500">
            {new Date(log.createdAt).toLocaleString('en', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 text-lg leading-none"
        >
          ×
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-zinc-950 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold font-mono ${statusColor(log.status).split(' ')[0]}`}>{log.status}</div>
          <div className="text-[11px] text-zinc-600 mt-0.5">status</div>
        </div>
        <div className="bg-zinc-950 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold font-mono ${durationColor(log.durationMs)}`}>{log.durationMs}ms</div>
          <div className="text-[11px] text-zinc-600 mt-0.5">duration</div>
        </div>
        <div className="bg-zinc-950 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-zinc-300">
            {log.authType === 'apikey' ? '⚡' : log.authType === 'session' ? '🌐' : '—'}
          </div>
          <div className="text-[11px] text-zinc-600 mt-0.5">
            {log.authType ?? 'unauthenticated'}
          </div>
        </div>
      </div>

      {log.apiKeyName && (
        <div className="text-xs text-zinc-500 mb-3">
          API key: <span className="text-purple-400 font-medium">{log.apiKeyName}</span>
        </div>
      )}

      {log.error && (
        <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3">
          <div className="text-[11px] text-red-400 font-medium mb-1">Error</div>
          <div className="font-mono text-xs text-red-300 break-all">{log.error}</div>
        </div>
      )}
    </div>
  )
}