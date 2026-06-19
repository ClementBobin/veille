'use client'

import { useState, useEffect } from 'react'

type SourceTypeTemplate = {
  label: string
  value: string
}

type SourceTypeMeta = {
  value: string
  label: string
  color: string
  icon: string
  cacheSupported: boolean
  urlPlaceholder: string
  urlHint?: string
  urlPattern?: string
  urlTemplate?: string
  urlTemplateLabel?: string
  urlTemplates?: SourceTypeTemplate[]
}

type Source = {
  id: string
  name: string
  url: string
  type: string
  active: boolean
  cache: boolean
  lastFetch: string | null
}

const EMPTY_FORM = { name: '', url: '', type: '', cache: false }

function useSourceTypes() {
  const [types, setTypes] = useState<SourceTypeMeta[]>([])
  useEffect(() => {
    fetch('/api/sources/type').then(r => r.json()).then(setTypes)
  }, [])
  return types
}

function getMeta(types: SourceTypeMeta[], typeValue: string): SourceTypeMeta | undefined {
  return types.find(t => t.value === typeValue)
}

function validateUrl(url: string, meta?: SourceTypeMeta): string | null {
  if (!url) return null
  if (meta?.urlPattern) {
    try {
      if (!new RegExp(meta.urlPattern).test(url)) return `URL invalide pour le type ${meta.label}`
    } catch {}
  }
  return null
}

function UrlField({
  value,
  onChange,
  meta,
}: {
  value: string
  onChange: (v: string) => void
  meta?: SourceTypeMeta
}) {
  const error = validateUrl(value, meta)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={meta?.urlPlaceholder ?? 'https://...'}
          className={`input-base flex-1 ${error ? 'border-red-500/60' : ''}`}
        />
        {meta?.urlTemplate && (
          <button
            type="button"
            onClick={() => onChange(meta.urlTemplate!)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors whitespace-nowrap"
          >
            {meta.urlTemplateLabel ?? '+ Template'}
          </button>
        )}
      </div>
      {meta?.urlHint && !error && (
        <div className="text-[11px] text-zinc-600">{meta.urlHint}</div>
      )}
      {error && (
        <div className="text-[11px] text-red-400">{error}</div>
      )}
    </div>
  )
}

function TemplatesHelper({
  templates,
  onSelect,
}: {
  templates: SourceTypeTemplate[]
  onSelect: (url: string) => void
}) {
  if (!templates.length) return null
  return (
    <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
      <div className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">Templates</div>
      <div className="grid grid-cols-2 gap-1.5">
        {templates.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            className="text-left text-[11px] text-zinc-400 hover:text-indigo-300 px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 transition-colors truncate"
            title={t.value}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SourcesPage() {
  const types = useSourceTypes()
  const [sources, setSources] = useState<Source[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Source>>({})
  const [editShowTemplates, setEditShowTemplates] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (types.length && !form.type) {
      setForm(f => ({ ...f, type: types[0].value }))
    }
  }, [types])

  useEffect(() => {
    fetch('/api/sources').then(r => r.json()).then(setSources).finally(() => setLoading(false))
  }, [])

  const formMeta = getMeta(types, form.type)
  const editMeta = getMeta(types, editForm.type ?? '')
  const urlError = validateUrl(form.url, formMeta)
  const editUrlError = validateUrl(editForm.url ?? '', editMeta)

  const save = async () => {
    if (!form.name || !form.url || urlError) return
    const payload = { ...form, cache: formMeta?.cacheSupported ? form.cache : false }
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const s = await res.json()
    setSources(prev => [...prev, s])
    setForm({ ...EMPTY_FORM, type: types[0]?.value ?? '' })
    setShowForm(false)
    setShowTemplates(false)
  }

  const startEdit = (s: Source) => {
    setEditId(s.id)
    setEditForm({ name: s.name, url: s.url, type: s.type, active: s.active, cache: s.cache })
    setEditShowTemplates(false)
  }

  const commitEdit = async () => {
    if (!editId || editUrlError) return
    const meta = getMeta(types, editForm.type ?? '')
    const payload = { ...editForm, cache: meta?.cacheSupported ? editForm.cache : false }
    const res = await fetch(`/api/sources/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await res.json()
    setSources(prev => prev.map(x => x.id === editId ? updated : x))
    setEditId(null)
  }

  const toggleActive = async (s: Source) => {
    await fetch(`/api/sources/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    setSources(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x))
  }

  const toggleCache = async (s: Source) => {
    await fetch(`/api/sources/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cache: !s.cache }),
    })
    setSources(prev => prev.map(x => x.id === s.id ? { ...x, cache: !x.cache } : x))
  }

  const remove = async (id: string) => {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' })
    setSources(prev => prev.filter(x => x.id !== id))
  }

  const TypeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-base">
      {types.map(t => (
        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
      ))}
    </select>
  )

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sources</h1>
          <p className="text-zinc-500 text-sm mt-1">Flux RSS, réseaux sociaux, vidéos et fichiers à surveiller</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nom"
              className="input-base"
            />
            <div className="col-span-2">
              <UrlField value={form.url} onChange={url => setForm({ ...form, url })} meta={formMeta} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-48">
              <TypeSelect
                value={form.type}
                onChange={type => { setForm({ ...form, type, url: '', cache: false }); setShowTemplates(false) }}
              />
            </div>
            {!!formMeta?.urlTemplates?.length && (
              <button
                type="button"
                onClick={() => setShowTemplates(h => !h)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showTemplates ? '▲ Fermer' : '▼ Templates'}
              </button>
            )}
            {formMeta?.cacheSupported && (
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none ml-auto">
                <input
                  type="checkbox"
                  checked={form.cache}
                  onChange={e => setForm({ ...form, cache: e.target.checked })}
                  className="accent-indigo-500"
                />
                Cache — skip si déjà collecté
              </label>
            )}
          </div>

          {showTemplates && !!formMeta?.urlTemplates?.length && (
            <TemplatesHelper
              templates={formMeta.urlTemplates}
              onSelect={url => { setForm({ ...form, url }); setShowTemplates(false) }}
            />
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={!form.name || !form.url || !!urlError}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
            <button onClick={() => { setShowForm(false); setShowTemplates(false) }} className="btn-ghost">
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading && <div className="text-zinc-600 text-sm">Chargement…</div>}

      <div className="flex flex-col gap-2">
        {sources.map(s => {
          const meta = getMeta(types, s.type)
          return editId === s.id ? (
            /* ── Inline edit row ── */
            <div key={s.id} className="bg-zinc-900 border border-indigo-600 rounded-xl px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-base"
                  placeholder="Nom"
                />
                <div className="col-span-2">
                  <UrlField
                    value={editForm.url ?? ''}
                    onChange={url => setEditForm({ ...editForm, url })}
                    meta={editMeta}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <TypeSelect
                    value={editForm.type ?? ''}
                    onChange={type => { setEditForm({ ...editForm, type, cache: false }); setEditShowTemplates(false) }}
                  />
                </div>
                {!!editMeta?.urlTemplates?.length && (
                  <button
                    type="button"
                    onClick={() => setEditShowTemplates(h => !h)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {editShowTemplates ? '▲ Fermer' : '▼ Templates'}
                  </button>
                )}
                {editMeta?.cacheSupported && (
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none ml-auto">
                    <input
                      type="checkbox"
                      checked={editForm.cache ?? false}
                      onChange={e => setEditForm({ ...editForm, cache: e.target.checked })}
                      className="accent-indigo-500"
                    />
                    Cache actif
                  </label>
                )}
              </div>
              {editShowTemplates && !!editMeta?.urlTemplates?.length && (
                <TemplatesHelper
                  templates={editMeta.urlTemplates}
                  onSelect={url => { setEditForm({ ...editForm, url }); setEditShowTemplates(false) }}
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={commitEdit}
                  disabled={!!editUrlError}
                  className="btn-primary disabled:opacity-40"
                >
                  Sauvegarder
                </button>
                <button onClick={() => setEditId(null)} className="btn-ghost">Annuler</button>
              </div>
            </div>
          ) : (
            /* ── Normal row ── */
            <div
              key={s.id}
              className={`bg-zinc-900 border rounded-xl px-5 py-4 flex items-center gap-4 ${
                s.active ? 'border-zinc-800' : 'border-zinc-900 opacity-60'
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              <div className="text-base flex-shrink-0">{meta?.icon ?? '📡'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-zinc-200">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta?.color ?? 'text-zinc-400 bg-zinc-800'}`}>
                    {meta?.label ?? s.type}
                  </span>
                  {meta?.cacheSupported && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.cache ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-600 bg-zinc-800'
                    }`}>
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
                    ? new Date(s.lastFetch).toLocaleString('fr', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Jamais'}
                </div>
              </div>

              <button
                onClick={() => toggleActive(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  s.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}
              >
                {s.active ? 'ON' : 'OFF'}
              </button>

              {meta?.cacheSupported && (
                <button
                  onClick={() => toggleCache(s)}
                  title="Toggle cache"
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    s.cache ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  ⚡
                </button>
              )}

              <button onClick={() => startEdit(s)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm px-1">
                ✏️
              </button>
              <button onClick={() => remove(s.id)} className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none">
                ×
              </button>
            </div>
          )
        })}
        {!loading && sources.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Aucune source. Ajoute-en une !</div>
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