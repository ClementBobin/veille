'use client'

import { useState, useEffect } from 'react'

type Source = { id: string; name: string; url: string; type: string; active: boolean; lastFetch: string | null }

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', type: 'RSS' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/sources').then(r => r.json()).then(setSources).finally(() => setLoading(false)) }, [])

  const add = async () => {
    if (!form.name || !form.url) return
    const res = await fetch('/api/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const s = await res.json()
    setSources([...sources, s])
    setForm({ name: '', url: '', type: 'RSS' })
    setShowForm(false)
  }

  const toggle = async (s: Source) => {
    await fetch(`/api/sources/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !s.active }) })
    setSources(sources.map(x => x.id === s.id ? { ...x, active: !x.active } : x))
  }

  const remove = async (id: string) => {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' })
    setSources(sources.filter(x => x.id !== id))
  }

  const typeColor: Record<string, string> = {
    RSS: 'text-sky-400 bg-sky-400/10',
    API: 'text-purple-400 bg-purple-400/10',
    SCRAPING: 'text-orange-400 bg-orange-400/10',
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sources</h1>
          <p className="text-zinc-500 text-sm mt-1">Flux RSS, APIs et pages à surveiller</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nom" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500" />
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://..." className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 col-span-1" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500">
              <option>RSS</option><option>API</option><option>SCRAPING</option><option>VIDEO</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition-colors">Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="border border-zinc-700 text-zinc-400 text-xs px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {loading && <div className="text-zinc-600 text-sm">Chargement...</div>}

      <div className="flex flex-col gap-2">
        {sources.map(s => (
          <div key={s.id} className={`bg-zinc-900 border rounded-xl px-5 py-4 flex items-center gap-4 ${s.active ? 'border-zinc-800' : 'border-zinc-900 opacity-60'}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-zinc-200">{s.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[s.type]}`}>{s.type}</span>
              </div>
              <div className="text-xs text-zinc-600 font-mono truncate">{s.url}</div>
            </div>
            <div className="text-right text-xs text-zinc-600 flex-shrink-0">
              <div>Dernier fetch</div>
              <div className="text-zinc-500">{s.lastFetch ? new Date(s.lastFetch).toLocaleString('fr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}</div>
            </div>
            <button onClick={() => toggle(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
              {s.active ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => remove(s.id)} className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none">×</button>
          </div>
        ))}
        {!loading && sources.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Aucune source. Ajoute-en une !</div>
        )}
      </div>
    </div>
  )
}
