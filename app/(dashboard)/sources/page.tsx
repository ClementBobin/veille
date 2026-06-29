'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { BulkActionBar } from '@/components/ui/bulk-action-bar'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'
import { useSourceTypes, getMeta } from '@/hooks/use-source-types'
import { SourceForm, type SourceFormState } from '@/components/sources/source-form'
import { SourceRow } from '@/components/sources/source-row'
import { SourceEditRow } from '@/components/sources/source-edit-row'
import { useDebounce } from '@/hooks/use-debouncer'
import type { Source } from '@/types'
import type { CategoryOption } from '@/components/categories/category-picker'

type SourceWithCats = Source & { categories?: { category: CategoryOption }[] }

const EMPTY_FORM: SourceFormState = { name: '', url: '', type: '', cache: false, categories: [] }
const PAGE_SIZE = 10

export default function SourcesPage() {
  const types = useSourceTypes()
  const [sources, setSources] = useState<SourceWithCats[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SourceFormState>(EMPTY_FORM)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<SourceWithCats> & { categories?: CategoryOption[] }>({})
  const [editShowTemplates, setEditShowTemplates] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    if (types.length && !form.type) setForm(f => ({ ...f, type: types[0].value }))
  }, [types])

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sources?page=${p}&limit=${PAGE_SIZE}&search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSources(data.sources)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1, debouncedSearch) }, [debouncedSearch, load])

  const save = async () => {
    const formMeta = getMeta(types, form.type)
    if (!form.name || !form.url) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        cache: formMeta?.cacheSupported ? form.cache : false,
        categoryIds: form.categories.map(c => c.id),
      }
      const res = await fetch('/api/sources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const s = await res.json()
      if (!res.ok) { toast.error(s.error ?? 'Failed to add source'); return }
      setForm({ ...EMPTY_FORM, type: types[0]?.value ?? '' })
      setShowForm(false); setShowTemplates(false)
      toast.success('Source added')
      load(1, debouncedSearch)
    } finally { setSaving(false) }
  }

  const startEdit = (s: SourceWithCats) => {
    setEditId(s.id)
    setEditForm({
      name: s.name, url: s.url, type: s.type, active: s.active, cache: s.cache,
      categories: s.categories?.map(c => c.category) ?? [],
    })
    setEditShowTemplates(false)
  }

  const commitEdit = async () => {
    if (!editId) return
    const meta = getMeta(types, editForm.type ?? '')
    const payload = {
      ...editForm,
      cache: meta?.cacheSupported ? editForm.cache : false,
      categoryIds: (editForm.categories ?? []).map(c => c.id),
    }
    const res = await fetch(`/api/sources/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await res.json()
    if (!res.ok) { toast.error(updated.error ?? 'Failed to update source'); return }
    setEditId(null)
    toast.success('Source updated')
    load(page, debouncedSearch)
  }

  const toggleActive = async (s: SourceWithCats) => {
    await fetch(`/api/sources/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    setSources(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x))
  }

  const toggleCache = async (s: SourceWithCats) => {
    await fetch(`/api/sources/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cache: !s.cache }),
    })
    setSources(prev => prev.map(x => x.id === s.id ? { ...x, cache: !x.cache } : x))
  }

  const remove = async (id: string) => {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' })
    toast.success('Source deleted')
    load(page, debouncedSearch)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const bulkSetActive = async (active: boolean) => {
    if (!selected.size) return
    setBulkBusy(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/sources/bulk', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) { toast.error('Bulk update failed'); return }
      setSources(prev => prev.map(s => selected.has(s.id) ? { ...s, active } : s))
      toast.success(`${ids.length} source(s) ${active ? 'enabled' : 'disabled'}`)
      setSelected(new Set())
    } finally { setBulkBusy(false) }
  }

  const goPage = (p: number) => load(p, debouncedSearch)

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sources</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {total > 0 ? `${total} source${total !== 1 ? 's' : ''}` : 'RSS feeds, social networks, videos and files to monitor'}
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }} id="add-source">+ Add</Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search sources…"
          className="max-w-xs h-8 text-sm"
        />
      </div>

      {showForm && (
        <SourceForm
          types={types} form={form} onFormChange={setForm}
          showTemplates={showTemplates} onShowTemplatesChange={setShowTemplates}
          onSave={save} onCancel={() => { setShowForm(false); setShowTemplates(false) }}
        />
      )}
      {saving && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3"><Spinner /> Saving source…</div>
      )}

      <BulkActionBar
        count={selected.size} busy={bulkBusy}
        onEnable={() => bulkSetActive(true)} onDisable={() => bulkSetActive(false)}
        onClear={() => setSelected(new Set())}
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[72px] w-full bg-zinc-900" />)}
        </div>
      ) : sources.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">📡</EmptyMedia>
            <EmptyTitle>{search ? 'No sources match your search' : 'No sources yet'}</EmptyTitle>
            <EmptyDescription>Add a feed, account or file to start monitoring.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {sources.map(s => {
              const meta = getMeta(types, s.type)
              return editId === s.id ? (
                <SourceEditRow
                  key={s.id} types={types} form={editForm} onFormChange={setEditForm}
                  showTemplates={editShowTemplates} onShowTemplatesChange={setEditShowTemplates}
                  onSave={commitEdit} onCancel={() => setEditId(null)}
                />
              ) : (
                <SourceRow
                  key={s.id} source={s} meta={meta} selected={selected.has(s.id)}
                  onToggleSelect={() => toggleSelect(s.id)} onToggleActive={() => toggleActive(s)}
                  onToggleCache={() => toggleCache(s)} onEdit={() => startEdit(s)} onRemove={() => remove(s.id)}
                />
              )
            })}
          </div>

          {pages > 1 && (
            <Pagination className="mt-6 justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => goPage(Math.max(1, page - 1))} className={page === 1 ? 'opacity-40 pointer-events-none' : ''} />
                </PaginationItem>
                {Array.from({ length: pages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => goPage(i + 1)}>{i + 1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => goPage(Math.min(pages, page + 1))} className={page === pages ? 'opacity-40 pointer-events-none' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
