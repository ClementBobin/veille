'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from "@/hooks/use-debouncer";

// ─── Types ───────────────────────────────────────────────────────────────────

type Log = {
  id: string
  method: string
  path: string
  status: number
  durationMs: number
  authType: string | null
  apiKeyName: string | null
  error: string | null
  createdAt: string
}

type LogsResponse = { logs: Log[]; total: number; page: number; pages: number; limit: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: number) {
  if (status < 300) return 'text-emerald-400 bg-emerald-400/10'
  if (status < 400) return 'text-sky-400 bg-sky-400/10'
  if (status < 500) return 'text-amber-400 bg-amber-400/10'
  return 'text-red-400 bg-red-400/10'
}

function methodColor(method: string) {
  if (method === 'GET') return 'text-sky-400'
  if (method === 'POST') return 'text-emerald-400'
  if (method === 'PATCH' || method === 'PUT') return 'text-amber-400'
  if (method === 'DELETE') return 'text-red-400'
  return 'text-zinc-400'
}

function durationColor(ms: number) {
  if (ms < 100) return 'text-emerald-400'
  if (ms < 500) return 'text-amber-400'
  return 'text-red-400'
}

function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function fmtDate(date: string) {
  return new Date(date).toLocaleDateString('fr', { day: '2-digit', month: 'short' })
}

const METHODS = ['', 'GET', 'POST', 'PATCH', 'DELETE']
const AUTH_TYPES = ['', 'session', 'apikey']
const STATUSES = ['', '200', '201', '400', '401', '403', '404', '500']

// ─── Row ─────────────────────────────────────────────────────────────────────

function LogRow({ log, onClick, active }: { log: Log; onClick: () => void; active: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[80px_60px_1fr_70px_80px_90px] gap-3 px-4 py-2.5 text-xs cursor-pointer border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors items-center ${
        active ? 'bg-indigo-950/30' : ''
      }`}
    >
      <div className="text-zinc-500 font-mono text-[11px]">
        <div>{fmtDate(log.createdAt)}</div>
        <div>{fmtTime(log.createdAt)}</div>
      </div>
      <div className={`font-mono font-bold text-[11px] ${methodColor(log.method)}`}>{log.method}</div>
      <div className="font-mono text-zinc-300 truncate" title={log.path}>{log.path}</div>
      <div className={`font-mono font-medium px-1.5 py-0.5 rounded text-[11px] text-center ${statusColor(log.status)}`}>
        {log.status}
      </div>
      <div className={`font-mono text-right ${durationColor(log.durationMs)}`}>{log.durationMs}ms</div>
      <div className="text-zinc-600 text-[11px] truncate">
        {log.authType === 'apikey' && log.apiKeyName ? (
          <span className="text-purple-400">⚡ {log.apiKeyName}</span>
        ) : log.authType === 'session' ? (
          <span className="text-indigo-400">🌐 session</span>
        ) : (
          <span>—</span>
        )}
      </div>
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function LogDetail({ log, onClose }: { log: Log; onClose: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono font-bold text-sm ${methodColor(log.method)}`}>{log.method}</span>
            <span className="font-mono text-sm text-zinc-200">{log.path}</span>
          </div>
          <div className="text-xs text-zinc-500">
            {new Date(log.createdAt).toLocaleString('fr', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg leading-none">×</button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-zinc-950 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold font-mono ${statusColor(log.status).split(' ')[0]}`}>{log.status}</div>
          <div className="text-[11px] text-zinc-600 mt-0.5">status</div>
        </div>
        <div className="bg-zinc-950 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold font-mono ${durationColor(log.durationMs)}`}>{log.durationMs}ms</div>
          <div className="text-[11px] text-zinc-600 mt-0.5">durée</div>
        </div>
        <div className="bg-zinc-950 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-zinc-300">
            {log.authType === 'apikey' ? '⚡' : log.authType === 'session' ? '🌐' : '—'}
          </div>
          <div className="text-[11px] text-zinc-600 mt-0.5">
            {log.authType ?? 'non authentifié'}
          </div>
        </div>
      </div>
      {log.apiKeyName && (
        <div className="text-xs text-zinc-500 mb-3">
          Clé API : <span className="text-purple-400 font-medium">{log.apiKeyName}</span>
        </div>
      )}
      {log.error && (
        <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3">
          <div className="text-[11px] text-red-400 font-medium mb-1">Erreur</div>
          <div className="font-mono text-xs text-red-300 break-all">{log.error}</div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [page, setPage] = useState(1)

  // Filters
  const [filterPath, setFilterPath] = useState('')
  const debouncedPath = useDebounce(filterPath, 800);
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

  const selectEl = 'bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-indigo-500 transition-colors'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Logs API</h1>
        <p className="text-zinc-500 text-sm mt-1">Historique des requêtes — session web et clés API</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 items-center">
        <input
          value={filterPath}
          onChange={e => setFilterPath(e.target.value)}
          placeholder="Filtrer par chemin…"
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
        />
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={selectEl}>
          {METHODS.map(m => <option key={m} value={m}>{m || 'Méthode'}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectEl}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'Status'}</option>)}
        </select>
        <select value={filterAuth} onChange={e => setFilterAuth(e.target.value)} className={selectEl}>
          {AUTH_TYPES.map(a => <option key={a} value={a}>{a || 'Auth'}</option>)}
        </select>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors flex-shrink-0"
        >
          ↻
        </button>
      </div>

      {/* Detail panel */}
      {selectedLog && (
        <div className="mb-4">
          <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[80px_60px_1fr_70px_80px_90px] gap-3 px-4 py-2 border-b border-zinc-700 bg-zinc-950">
          {['Date', 'Méthode', 'Chemin', 'Status', 'Durée', 'Auth'].map(h => (
            <div key={h} className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-600 text-sm">Chargement…</div>
        ) : !data || data.logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📭</div>
            <div className="text-zinc-500 text-sm">Aucun log trouvé</div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {data.logs.map(log => (
              <LogRow
                key={log.id}
                log={log}
                active={selectedLog?.id === log.id}
                onClick={() => setSelectedLog(prev => prev?.id === log.id ? null : log)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950">
            <div className="text-xs text-zinc-600">
              {data.total} requête(s) · page {data.page}/{data.pages}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                ← Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="text-xs px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}