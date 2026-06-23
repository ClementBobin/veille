import { TableRow, TableCell } from '@/components/ui/table'
import type { Log } from '@/types'
import { statusColor, methodColor, durationColor, fmtTime, fmtDate } from '@/lib/utils'

type LogRowProps = {
  log: Log
  active: boolean
  onClick: () => void
}

export function LogRow({ log, active, onClick }: LogRowProps) {
  return (
    <TableRow
      onClick={onClick}
      data-state={active ? 'selected' : undefined}
      className="cursor-pointer text-xs"
    >
      <TableCell className="font-mono text-[11px] text-zinc-500 whitespace-nowrap">
        <div>{fmtDate(log.createdAt)}</div>
        <div>{fmtTime(log.createdAt)}</div>
      </TableCell>
      <TableCell className={`font-mono font-bold text-[11px] ${methodColor(log.method)}`}>{log.method}</TableCell>
      <TableCell className="font-mono text-zinc-300 max-w-xs truncate" title={log.path}>{log.path}</TableCell>
      <TableCell>
        <span className={`font-mono font-medium px-1.5 py-0.5 rounded text-[11px] ${statusColor(log.status)}`}>
          {log.status}
        </span>
      </TableCell>
      <TableCell className={`font-mono text-right ${durationColor(log.durationMs)}`}>{log.durationMs}ms</TableCell>
      <TableCell className="text-zinc-600 text-[11px]">
        {log.authType === 'apikey' && log.apiKeyName ? (
          <span className="text-purple-400">⚡ {log.apiKeyName}</span>
        ) : log.authType === 'session' ? (
          <span className="text-indigo-400">🌐 session</span>
        ) : (
          <span>—</span>
        )}
      </TableCell>
    </TableRow>
  )
}