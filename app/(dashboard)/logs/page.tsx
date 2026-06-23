'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debouncer'
import { LogFilters } from '@/components/logs/log-filters'
import { LogTable } from '@/components/logs/log-table'
import { LogDetail } from '@/components/logs/log-detail'
import type { Log, LogsResponse } from '@/types'

export default function LogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [page, setPage] = useState(1)

  const [filterPath, setFilterPath] = useState('')
  const debouncedPath = useDebounce(filterPath, 800)
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAuth, setFilterAuth] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (debouncedPath) params.set('path', debouncedPath)
    if (filterMethod) params.set('method', filterMethod)
    if (filterStatus) params.set('status', filterStatus)
    if (filterAuth) params.set('authType', filterAuth)

    const res = await fetch(`/api/system/logs?${params}`)
    const json: LogsResponse = await res.json()
    setData(json)
    setLoading(false)
  }, [page, debouncedPath, filterMethod, filterStatus, filterAuth])

  useEffect(() => { load() }, [load])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [debouncedPath, filterMethod, filterStatus, filterAuth])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">API logs</h1>
        <p className="text-zinc-500 text-sm mt-1">Request history — web session and API keys</p>
      </div>

      <LogFilters
        path={filterPath}
        onPathChange={setFilterPath}
        method={filterMethod}
        onMethodChange={setFilterMethod}
        status={filterStatus}
        onStatusChange={setFilterStatus}
        authType={filterAuth}
        onAuthTypeChange={setFilterAuth}
        onRefresh={load}
      />

      {selectedLog && (
        <div className="mb-4">
          <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
      )}

      <LogTable
        data={data}
        loading={loading}
        selectedLogId={selectedLog?.id ?? null}
        onSelect={(log) => setSelectedLog(prev => (prev?.id === log.id ? null : log))}
        onPageChange={setPage}
      />
    </div>
  )
}