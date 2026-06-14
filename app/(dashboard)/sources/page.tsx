'use client'

import { useState, useEffect } from 'react'

type Source = {
  id: string
  name: string
  url: string
  type: string
  active: boolean
  cache: boolean
  lastFetch: string | null
}

const SOURCE_TYPES = ['RSS', 'API', 'SCRAPING', 'VIDEO'] as const
type SourceType = (typeof SOURCE_TYPES)[number]

/** RSS et API → cache masqué et forcé à false */
const CACHE_VISIBLE: SourceType[] = ['SCRAPING', 'VIDEO']

const typeColor: Record<string, string> = {
  RSS: 'text-sky-400 bg-sky-400/10',
  API: 'text-purple-400 bg-purple-400/10',
  SCRAPING: 'text-orange-400 bg-orange-400/10',
  VIDEO: 'text-pink-400 bg-pink-400/10',
}

const EMPTY_FORM = { name: '', url: '', type: 'RSS' as SourceType, cache: false }

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Source>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sources')
      .then((r) => r.json())
      .then(setSources)
      .finally(() => setLoading(false))
  }, [])

  // ── helpers ──────────────────────────────────────────────────────────────
  const cacheVisible = (type: string) => CACHE_VISIBLE.includes(type as SourceType)

  const save = async () => {
    if (!form.name || !form.url) return
    const payload = {
      ...form,
      // si le type ne supporte pas le cache, on force false
      cache: cacheVisible(form.type) ? form.cache : false,
    }
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const s = await res.json()
    setSources((prev) => [...prev, s])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const startEdit = (s: Source) => {
    setEditId(s.id)
    setEditForm({ name: s.name, url: s.url, type: s.type, active: s.active, cache: s.cache })
  }

  const commitEdit = async () => {
    if (!editId) return
    const payload = {
      ...editForm,
      cache: cacheVisible(editForm.type ?? '') ? editForm.cache : false,
    }
    const res = await fetch(`/api/sources/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await res.json()
    setSources((prev) => prev.map((x) => (x.id === editId ? updated : x)))
    setEditId(null)
  }

  const toggleActive = async (s: Source) => {
    await fetch(`/api/sources/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    setSources((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)))
  }

  const toggleCache = async (s: Source) => {
    await fetch(`/api/sources/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cache: !s.cache }),
    })
    setSources((prev) => prev.map((x) => (x.id === s.id ? { ...x, cache: !x.cache } : x)))
  }

  const remove = async (id: string) => {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' })
    setSources((prev) => prev.filter((x) => x.id !== id))
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sources</h1>
          <p className="text-zinc-500 text-sm mt-1">Flux RSS, APIs et pages à surveiller</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* ── Formulaire ajout ── */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom"
              className="input-base"
            />
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="input-base"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as SourceType, cache: false })}
              className="input-base"
            >
              {SOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {cacheVisible(form.type) && (
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.cache}
                onChange={(e) => setForm({ ...form, cache: e.target.checked })}
                className="accent-indigo-500"
              />
              Cache actif — skip si un article de cette source existe déjà
            </label>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={save} className="btn-primary">Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      {loading && <div className="text-zinc-600 text-sm">Chargement…</div>}

      <div className="flex flex-col gap-2">
        {sources.map((s) =>
          editId === s.id ? (
            /* ── Ligne en édition inline ── */
            <div key={s.id} className="bg-zinc-900 border border-indigo-600 rounded-xl px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-base"
                  placeholder="Nom"
                />
                <input
                  value={editForm.url ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  className="input-base"
                  placeholder="URL"
                />
                <select
                  value={editForm.type ?? 'RSS'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value, cache: false })
                  }
                  className="input-base"
                >
                  {SOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {cacheVisible(editForm.type ?? '') && (
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.cache ?? false}
                    onChange={(e) => setEditForm({ ...editForm, cache: e.target.checked })}
                    className="accent-indigo-500"
                  />
                  Cache actif
                </label>
              )}
              <div className="flex gap-2">
                <button onClick={commitEdit} className="btn-primary">Sauvegarder</button>
                <button onClick={() => setEditId(null)} className="btn-ghost">Annuler</button>
              </div>
            </div>
          ) : (
            /* ── Ligne normale ── */
            <div
              key={s.id}
              className={`bg-zinc-900 border rounded-xl px-5 py-4 flex items-center gap-4 ${
                s.active ? 'border-zinc-800' : 'border-zinc-900 opacity-60'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  s.active ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-zinc-200">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[s.type] ?? ''}`}>
                    {s.type}
                  </span>
                  {cacheVisible(s.type) && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.cache
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-zinc-600 bg-zinc-800'
                      }`}
                    >
                      cache {s.cache ? 'ON' : 'OFF'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-600 font-mono truncate">{s.url}</div>
              </div>

              <div className="text-right text-xs text-zinc-600 flex-shrink-0">
                <div>Dernier fetch</div>
                <div className="text-zinc-500">
                  {s.lastFetch
                    ? new Date(s.lastFetch).toLocaleString('fr', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Jamais'}
                </div>
              </div>

              <button
                onClick={() => toggleActive(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  s.active
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}
              >
                {s.active ? 'ON' : 'OFF'}
              </button>

              {cacheVisible(s.type) && (
                <button
                  onClick={() => toggleCache(s)}
                  title="Toggle cache"
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    s.cache
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  ⚡
                </button>
              )}

              <button
                onClick={() => startEdit(s)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm px-1"
              >
                ✏️
              </button>
              <button
                onClick={() => remove(s.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          )
        )}
        {!loading && sources.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Aucune source. Ajoute-en une !</div>
        )}
      </div>

      {/* Shared input styles via global CSS not available in RSC — using Tailwind @apply via style tag workaround */}
      <style>{`
        .input-base {
          background: #09090b;
          border: 1px solid #3f3f46;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #f4f4f5;
          width: 100%;
          outline: none;
        }
        .input-base:focus { border-color: #6366f1; }
        .input-base::placeholder { color: #52525b; }
        .btn-primary {
          background: #4f46e5;
          color: white;
          font-size: 0.75rem;
          padding: 0.375rem 1rem;
          border-radius: 0.5rem;
          transition: background 0.15s;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover { background: #6366f1; }
        .btn-ghost {
          border: 1px solid #3f3f46;
          color: #a1a1aa;
          font-size: 0.75rem;
          padding: 0.375rem 1rem;
          border-radius: 0.5rem;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-ghost:hover { background: #27272a; }
      `}</style>
    </div>
  )
}
