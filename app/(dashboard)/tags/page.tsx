'use client'

import { useState, useEffect } from 'react'

const COLORS = ['#e11d48','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#a855f7','#ec4899']

type Tag = { id: string; name: string; color: string; description?: string }

const EMPTY_FORM = { name: '', color: '#6366f1', description: '' }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Tag>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags).finally(() => setLoading(false))
  }, [])

  const add = async () => {
    if (!form.name) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const t = await res.json()
    setTags([...tags, t])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const startEdit = (t: Tag) => {
    setEditId(t.id)
    setEditForm({ name: t.name, color: t.color, description: t.description })
  }

  const commitEdit = async () => {
    if (!editId) return
    const res = await fetch(`/api/tags/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const updated = await res.json()
    setTags((prev) => prev.map((x) => (x.id === editId ? updated : x)))
    setEditId(null)
  }

  const remove = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    setTags(tags.filter((t) => t.id !== id))
  }

  const ColorPicker = ({
    value,
    onChange,
  }: {
    value: string
    onChange: (c: string) => void
  }) => (
    <div className="flex gap-2 mt-2">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            background: c,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: value === c ? '2px solid white' : '2px solid transparent',
            transform: value === c ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.1s',
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tags</h1>
          <p className="text-zinc-500 text-sm mt-1">Centres d'intérêt pour la catégorisation LLM</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom du tag (ex: AI/ML)"
              className="input-base"
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (aide le LLM)"
              className="input-base"
            />
          </div>
          <div className="text-xs text-zinc-500 mb-1">Couleur</div>
          <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          <div className="flex gap-2 mt-4">
            <button onClick={add} className="btn-primary">Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      {loading && <div className="text-zinc-600 text-sm">Chargement…</div>}

      <div className="grid grid-cols-2 gap-3">
        {tags.map((tag) =>
          editId === tag.id ? (
            <div
              key={tag.id}
              style={{ borderColor: (editForm.color ?? tag.color) + '55' }}
              className="bg-zinc-900 border rounded-xl p-5 col-span-1"
            >
              <div className="space-y-2 mb-3">
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-base"
                  placeholder="Nom"
                />
                <input
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-base"
                  placeholder="Description"
                />
                <div className="text-xs text-zinc-500">Couleur</div>
                <ColorPicker
                  value={editForm.color ?? '#6366f1'}
                  onChange={(c) => setEditForm({ ...editForm, color: c })}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={commitEdit} className="btn-primary">Sauvegarder</button>
                <button onClick={() => setEditId(null)} className="btn-ghost">Annuler</button>
              </div>
            </div>
          ) : (
            <div
              key={tag.id}
              style={{ borderColor: tag.color + '33' }}
              className="bg-zinc-900 border rounded-xl p-5 flex items-center gap-4 group"
            >
              <div
                style={{
                  background: tag.color + '22',
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 3, background: tag.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200">{tag.name}</div>
                <div className="text-xs text-zinc-600 mt-0.5 truncate">
                  {tag.description || 'Aucune description'}
                </div>
              </div>
              <button
                onClick={() => startEdit(tag)}
                className="text-zinc-700 hover:text-zinc-300 transition-colors text-sm opacity-0 group-hover:opacity-100"
              >
                ✏️
              </button>
              <button
                onClick={() => remove(tag.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          )
        )}
        {!loading && tags.length === 0 && (
          <div className="col-span-2 text-center py-16 text-zinc-600 text-sm">
            Aucun tag. Ajoute tes centres d'intérêt !
          </div>
        )}
      </div>

      <style>{`
        .input-base {
          background: #09090b; border: 1px solid #3f3f46; border-radius: 0.5rem;
          padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #f4f4f5; width: 100%; outline: none;
        }
        .input-base:focus { border-color: #6366f1; }
        .input-base::placeholder { color: #52525b; }
        .btn-primary { background:#4f46e5;color:white;font-size:0.75rem;padding:0.375rem 1rem;border-radius:0.5rem;transition:background 0.15s;border:none;cursor:pointer; }
        .btn-primary:hover { background:#6366f1; }
        .btn-ghost { border:1px solid #3f3f46;color:#a1a1aa;font-size:0.75rem;padding:0.375rem 1rem;border-radius:0.5rem;background:transparent;cursor:pointer;transition:background 0.15s; }
        .btn-ghost:hover { background:#27272a; }
      `}</style>
    </div>
  )
}
