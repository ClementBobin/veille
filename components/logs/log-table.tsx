import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { LogRow } from './log-row'
import type { Log, LogsResponse } from '@/types'

type LogTableProps = {
  data: LogsResponse | null
  loading: boolean
  selectedLogId: string | null
  onSelect: (log: Log) => void
  onPageChange: (page: number) => void
}

export function LogTable({ data, loading, selectedLogId, onSelect, onPageChange }: LogTableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700 hover:bg-transparent">
            <TableHead className="text-[10px] text-zinc-600 uppercase tracking-wider">Date</TableHead>
            <TableHead className="text-[10px] text-zinc-600 uppercase tracking-wider">Method</TableHead>
            <TableHead className="text-[10px] text-zinc-600 uppercase tracking-wider">Path</TableHead>
            <TableHead className="text-[10px] text-zinc-600 uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-[10px] text-zinc-600 uppercase tracking-wider">Duration</TableHead>
            <TableHead className="text-[10px] text-zinc-600 uppercase tracking-wider">Auth</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-5 w-full bg-zinc-800" />
                </TableCell>
              </TableRow>
            ))
          ) : !data || data.logs.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6}>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-transparent text-3xl">📭</EmptyMedia>
                    <EmptyTitle>No logs found</EmptyTitle>
                    <EmptyDescription>Try adjusting your filters.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            data.logs.map(log => (
              <LogRow
                key={log.id}
                log={log}
                active={selectedLogId === log.id}
                onClick={() => onSelect(log)}
              />
            ))
          )}
        </TableBody>
      </Table>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950">
          <div className="text-xs text-zinc-600">
            {data.total} request(s) · page {data.page}/{data.pages}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, data.page - 1))}
              disabled={data.page === 1}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(data.pages, data.page + 1))}
              disabled={data.page === data.pages}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}