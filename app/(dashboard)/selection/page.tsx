'use client'

import { useState, useEffect } from 'react'

type FeedItem = { id: string; title: string; url: string }
type TocArticle = { tocEntryId: string; feedItemId: string; feedItem: FeedItem }
type TocEntry = { id: string; order: number; title: string; summary: string; articles: TocArticle[] }
type Subject = { id: string; title: string; summary: string; selected: boolean; order: number }
type Digest = {
  id: string
  date: string
  title: string | null
  summary: string | null
  status: string
  subjects: Subject[]
  toc: TocEntry[]
}

export default function SelectionPage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/digest?status=PENDING')
      .then((r) => r.json())
      .then((data: Digest[]) => {
        setDigests(data)
        if (data.length > 0) {
          setActiveId(data[0].id)
          const initial: Record<string, Set<string>> = {}
          data.forEach((d) => {
            initial[d.id] = new Set(d.subjects.filter((s) => s.selected).map((s) => s.id))
          })
          setSelections(initial)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const digest = digests.find((d) => d.id === activeId) ?? null
  const selected = activeId ? (selections[activeId] ?? new Set<string>()) : new Set<string>()

  const toggle = (subjectId: string) => {
    if (!activeId) return
    setSelections((prev) => {
      const next = new Set(prev[activeId])
      next.has(subjectId) ? next.delete(subjectId) : next.add(subjectId)
      return { ...prev, [activeId]: next }
    })
  }

  const toggleAll = () => {
    if (!activeId || !digest) return
    const allIds = digest.subjects.map((s) => s.id)
    const allSelected = allIds.every((id) => selected.has(id))
    setSelections((prev) => ({
      ...prev,
      [activeId]: allSelected ? new Set() : new Set(allIds),
    }))
  }

  const save = async () => {
    if (!digest || !activeId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/digest/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId: activeId, selectedSubjectIds: [...selected] }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      setDone((prev) => ({ ...prev, [activeId]: true }))
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-zinc-600 text-sm">Chargement…</div>

  if (digests.length === 0)
    return (
      <div className="text-center py-24">
        <div className="text-4xl mb-4">📭</div>
        <div className="text-zinc-400 font-medium">Aucun digest en attente</div>
        <div className="text-zinc-600 text-sm mt-2">Le pipeline N8N doit d'abord être exécuté.</div>
      </div>
    )

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sélection du jour</h1>
          {digest && (
            <p className="text-zinc-500 text-sm mt-1">
              {new Date(digest.date).toLocaleDateString('fr', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              {' · '}
              {selected.size} / {digest.subjects.length} sujets sélectionnés
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {digest && !done[activeId!] && (
            <button
              onClick={toggleAll}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {digest.subjects.every((s) => selected.has(s.id)) ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
          {done[activeId!] ? (
            <div className="bg-emerald-500/10 text-emerald-400 text-xs px-4 py-2 rounded-lg">
              ✓ Sauvegardé — WF5 déclenché
            </div>
          ) : (
            <button
              onClick={save}
              disabled={selected.size === 0 || saving}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
                selected.size > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {saving ? 'Sauvegarde…' : 'Générer la note →'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Tabs */}
      {digests.length > 1 && (
        <div className="flex gap-1 mb-4 border-b border-zinc-800 overflow-x-auto">
          {digests.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                d.id === activeId
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {d.title ?? `Digest #${i + 1}`}
              {done[d.id] && <span className="ml-1.5 text-emerald-400">✓</span>}
              <span className="ml-2 text-zinc-600">
                {new Date(d.date).toLocaleDateString('fr', { day: '2-digit', month: 'short' })}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Digest card */}
      {digest && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Digest header */}
          <div className="px-6 py-5 border-b border-zinc-800">
            {digest.title && (
              <h2 className="text-base font-semibold text-white mb-1">{digest.title}</h2>
            )}
            {digest.summary && (
              <p className="text-xs text-zinc-500 leading-relaxed">{digest.summary}</p>
            )}
          </div>

          {/* Subjects with toc inline */}
          <div className="divide-y divide-zinc-800">
            {digest.subjects
              .sort((a, b) => a.order - b.order)
              .map((s, i) => {
                const isSelected = selected.has(s.id)
                // Match toc entry by order or title
                const tocEntry = digest.toc.find(
                  (t) => t.order === s.order || t.title.toLowerCase() === s.title.toLowerCase()
                )
                return (
                  <div
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`px-6 py-4 flex gap-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700'
                      }`}
                    >
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Subject title + number */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-600">#{i + 1}</span>
                        <span
                          className={`text-sm font-medium ${
                            isSelected ? 'text-indigo-300' : 'text-zinc-200'
                          }`}
                        >
                          {s.title}
                        </span>
                      </div>

                      {/* Subject summary */}
                      <p className="text-xs text-zinc-500 leading-relaxed mb-2">{s.summary}</p>

                      {/* Toc entry articles if matched */}
                      {tocEntry?.articles.length ? (
                        <div className="flex flex-wrap gap-2">
                          {tocEntry.articles.map((a) => (
                            <a
                              key={a.feedItemId}
                              href={a.feedItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              ↗ {a.feedItem.title}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}