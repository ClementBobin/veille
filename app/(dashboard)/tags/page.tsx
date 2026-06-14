'use client'

import { useState, useEffect } from 'react'

const COLORS = ['#e11d48','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#a855f7','#ec4899']

type Tag = { id: string; name: string; color: string; description?: string }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', color: '#6366f1', description: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/tags').then(r => r.json()).then(setTags).finally(() => setLoading(false)) }, [])

  const add = async () => {
    if (!form.name) return
    const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const t = await res.json()
    setTags([...tags, t])
    setForm({ name: '', color: '#6366f1', description: '' })
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    setTags(tags.filter(t => t.id !== id))
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tags</h1>
          <p className="text-zinc-500 text-sm mt-1">Centres d'intérêt pour la catégorisation LLM</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nom du tag (ex: AI/ML)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description (aide le LLM à catégoriser)" className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="mb-4">
            <div className="text-xs text-zinc-500 mb-2">Couleur</div>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  style={{ background: c, width: 24, height: 24, borderRadius: '50%', border: form.color === c ? '2px solid white' : '2px solid transparent', transform: form.color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition-colors">Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="border border-zinc-700 text-zinc-400 text-xs px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {loading && <div className="text-zinc-600 text-sm">Chargement...</div>}

      <div className="grid grid-cols-2 gap-3">
        {tags.map(tag => (
          <div key={tag.id} style={{ borderColor: tag.color + '33' }}
            className="bg-zinc-900 border rounded-xl p-5 flex items-center gap-4">
            <div style={{ background: tag.color + '22', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: tag.color }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-zinc-200">{tag.name}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{tag.description || 'Aucune description'}</div>
            </div>
            <button onClick={() => remove(tag.id)} className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none">×</button>
          </div>
        ))}
        {!loading && tags.length === 0 && (
          <div className="col-span-2 text-center py-16 text-zinc-600 text-sm">Aucun tag. Ajoute tes centres d'intérêt !</div>
        )}
      </div>
    </div>
  )
}
