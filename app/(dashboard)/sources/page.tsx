'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { BulkActionBar } from '@/components/ui/bulk-action-bar'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'
import { useSourceTypes, getMeta } from '@/hooks/use-source-types'
import { SourceForm, type SourceFormState } from '@/components/sources/source-form'
import { SourceRow } from '@/components/sources/source-row'
import { SourceEditRow } from '@/components/sources/source-edit-row'
import type { Source } from '@/types'

const EMPTY_FORM: SourceFormState = { name: '', url: '', type: '', cache: false }
const PAGE_SIZE = 8

export default function SourcesPage() {
  const types = useSourceTypes()
  const [sources, setSources] = useState<Source[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SourceFormState>(EMPTY_FORM)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Source>>({})
  const [editShowTemplates, setEditShowTemplates] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    if (types.length && !form.type) {
      setForm(f => ({ ...f, type: types[0].value }))
    }
  }, [types])

  useEffect(() => {
    fetch('/api/sources').then(r => r.json()).then(setSources).finally(() => setLoading(false))
  }, [])

  const pages = Math.max(1, Math.ceil(sources.length / PAGE_SIZE))
  const visibleSources = useMemo(
    () => sources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sources, page],
  )

  const save = async () => {
    const formMeta = getMeta(types, form.type)
    if (!form.name || !form.url) return
    setSaving(true)
    try {
      const payload = { ...form, cache: formMeta?.cacheSupported ? form.cache : false }
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const s = await res.json()
      if (!res.ok) {
        toast.error(s.error ?? 'Failed to add source')
        return
      }
      setSources(prev => [...prev, s])
      setForm({ ...EMPTY_FORM, type: types[0]?.value ?? '' })
      setShowForm(false)
      setShowTemplates(false)
      toast.success('Source added')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (s: Source) => {
    setEditId(s.id)
    setEditForm({ name: s.name, url: s.url, type: s.type, active: s.active, cache: s.cache })
    setEditShowTemplates(false)
  }

  const commitEdit = async () => {
    if (!editId) return
    const meta = getMeta(types, editForm.type ?? '')
    const payload = { ...editForm, cache: meta?.cacheSupported ? editForm.cache : false }
    const res = await fetch(`/api/sources/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await res.json()
    if (!res.ok) {
      toast.error(updated.error ?? 'Failed to update source')
      return
    }
    setSources(prev => prev.map(x => x.id === editId ? updated : x))
    setEditId(null)
    toast.success('Source updated')
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
    setSelected(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    toast.success('Source deleted')
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkSetActive = async (active: boolean) => {
    if (selected.size === 0) return
    setBulkBusy(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/sources/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) {
        toast.error('Bulk update failed')
        return
      }
      setSources(prev => prev.map(s => (selected.has(s.id) ? { ...s, active } : s)))
      toast.success(`${ids.length} source(s) ${active ? 'enabled' : 'disabled'}`)
      setSelected(new Set())
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sources</h1>
          <p className="text-zinc-500 text-sm mt-1">RSS feeds, social networks, videos and files to monitor</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }} id='add-source'>
          + Add
        </Button>
      </div>

      {showForm && (
        <SourceForm
          types={types}
          form={form}
          onFormChange={setForm}
          showTemplates={showTemplates}
          onShowTemplatesChange={setShowTemplates}
          onSave={save}
          onCancel={() => { setShowForm(false); setShowTemplates(false) }}
        />
      )}
      {saving && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <Spinner /> Saving source…
        </div>
      )}

      <BulkActionBar
        count={selected.size}
        busy={bulkBusy}
        onEnable={() => bulkSetActive(true)}
        onDisable={() => bulkSetActive(false)}
        onClear={() => setSelected(new Set())}
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full bg-zinc-900" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">📡</EmptyMedia>
            <EmptyTitle>No sources yet</EmptyTitle>
            <EmptyDescription>Add a feed, account or file to start monitoring.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {visibleSources.map(s => {
              const meta = getMeta(types, s.type)
              return editId === s.id ? (
                <SourceEditRow
                  key={s.id}
                  types={types}
                  form={editForm}
                  onFormChange={setEditForm}
                  showTemplates={editShowTemplates}
                  onShowTemplatesChange={setEditShowTemplates}
                  onSave={commitEdit}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <SourceRow
                  key={s.id}
                  source={s}
                  meta={meta}
                  selected={selected.has(s.id)}
                  onToggleSelect={() => toggleSelect(s.id)}
                  onToggleActive={() => toggleActive(s)}
                  onToggleCache={() => toggleCache(s)}
                  onEdit={() => startEdit(s)}
                  onRemove={() => remove(s.id)}
                />
              )
            })}
          </div>

          {pages > 1 && (
            <Pagination className="mt-6 justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? 'opacity-40 pointer-events-none' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: pages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    className={page === pages ? 'opacity-40 pointer-events-none' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}