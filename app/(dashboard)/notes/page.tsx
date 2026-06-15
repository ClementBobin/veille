'use client'

import { useState, useEffect } from 'react'

type Note = { id: string; title: string; content: string; filename: string; exportedTo: string[]; createdAt: string }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selected, setSelected] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  const toArray = (v: string | string[]) => Array.isArray(v) ? v : (v ? v.split(',') : [])

  useEffect(() => { fetch('/api/notes').then(r => r.json()).then(setNotes).finally(() => setLoading(false)) }, [])

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)}
        className="border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors mb-6">
        ← Retour
      </button>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">{selected.title}</h2>
            <div className="text-xs text-zinc-600 font-mono mt-1">{selected.filename}</div>
          </div>
          <div className="flex gap-2">
            {toArray(selected.exportedTo).map(e => (
              <span key={e} className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded">{e}</span>
            ))}
          </div>
        </div>
        <pre className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">{selected.content}</pre>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Notes</h1>
        <p className="text-zinc-500 text-sm mt-1">Notes Markdown générées par le pipeline</p>
      </div>

      {loading && <div className="text-zinc-600 text-sm">Chargement...</div>}

      <div className="flex flex-col gap-2">
        {notes.map(n => (
          <div key={n.id} onClick={() => setSelected(n)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0">📄</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-zinc-200">{n.title}</div>
              <div className="text-xs text-zinc-600 font-mono mt-0.5">{n.filename}</div>
            </div>
            <div className="flex gap-1.5">
              {toArray(n.exportedTo).map(e => (
                <span key={e} className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">{e}</span>
              ))}
            </div>
            <div className="text-xs text-zinc-600 flex-shrink-0">
              {new Date(n.createdAt).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        ))}
        {!loading && notes.length === 0 && (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-zinc-400 font-medium">Aucune note générée</div>
            <div className="text-zinc-600 text-sm mt-2">Le pipeline complet doit s'exécuter une fois.</div>
          </div>
        )}
      </div>
    </div>
  )
}
