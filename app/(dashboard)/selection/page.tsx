'use client'

import { useState, useEffect } from 'react'

type Subject = { id: string; title: string; summary: string; selected: boolean; order: number }
type Digest = { id: string; date: string; status: string; subjects: Subject[] }

export default function SelectionPage() {
  const [digest, setDigest] = useState<Digest | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/digest?status=PENDING')
      .then(r => r.json())
      .then((data: Digest[]) => {
        if (data.length > 0) {
          setDigest(data[0])
          setSelected(new Set(data[0].subjects.filter(s => s.selected).map(s => s.id)))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const save = async () => {
    if (!digest) return
    setSaving(true)
    await fetch('/api/digest/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ digestId: digest.id, selectedSubjectIds: [...selected] }),
    })
    setSaving(false)
    setDone(true)
  }

  if (loading) return <div className="text-zinc-600 text-sm">Chargement...</div>

  if (!digest) return (
    <div className="text-center py-24">
      <div className="text-4xl mb-4">📭</div>
      <div className="text-zinc-400 font-medium">Aucun digest en attente</div>
      <div className="text-zinc-600 text-sm mt-2">Le pipeline N8N doit d'abord être exécuté.</div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sélection du jour</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {new Date(digest.date).toLocaleDateString('fr', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}{digest.subjects.length} sujets condensés
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
          {done ? (
            <div className="bg-emerald-500/10 text-emerald-400 text-xs px-4 py-2 rounded-lg">✓ Sauvegardé</div>
          ) : (
            <button onClick={save} disabled={selected.size === 0 || saving}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${selected.size > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
              {saving ? 'Sauvegarde...' : 'Générer la note →'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {digest.subjects.sort((a, b) => a.order - b.order).map((s, i) => {
          const isSelected = selected.has(s.id)
          return (
            <div key={s.id} onClick={() => toggle(s.id)}
              className={`border rounded-xl px-5 py-4 flex gap-4 cursor-pointer transition-all ${isSelected ? 'bg-indigo-950/30 border-indigo-600' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700'}`}>
                {isSelected && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium mb-1.5 ${isSelected ? 'text-indigo-300' : 'text-zinc-200'}`}>{s.title}</div>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.summary}</p>
              </div>
              <div className="text-xs text-zinc-700 flex-shrink-0">#{i + 1}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
