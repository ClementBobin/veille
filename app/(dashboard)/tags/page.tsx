'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { BulkActionBar } from '@/components/ui/bulk-action-bar'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'
import { TagForm, type TagFormState } from '@/components/tags/tag-form'
import { TagEditCard } from '@/components/tags/tag-edit-card'
import { TagCard } from '@/components/tags/tag-card'
import { FilterBar } from '@/components/ui/filter-bar'
import { useDebounce } from '@/hooks/use-debouncer'
import type { Tag } from '@/types'
import type { CategoryOption } from '@/components/categories/category-picker'

type TagWithCats = Tag & { categories?: { category: CategoryOption }[] }

const EMPTY_FORM: TagFormState = { name: '', color: '#6366f1', description: '', categories: [] }
const PAGE_SIZE = 12

function buildUrl(p: number, q: string, categories: CategoryOption[]) {
  const params = new URLSearchParams()
  params.set('page', String(p))
  params.set('limit', String(PAGE_SIZE))
  if (q) params.set('search', q)
  categories.forEach(c => params.append('categoryId', c.id))
  return `/api/tags?${params.toString()}`
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCats[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filterCategories, setFilterCategories] = useState<CategoryOption[]>([])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TagFormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Omit<Partial<TagWithCats>, 'categories'> & { categories?: CategoryOption[] }>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(async (p: number, q: string, cats: CategoryOption[]) => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl(p, q, cats))
      const data = await res.json()
      setTags(data.tags)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1, debouncedSearch, filterCategories) }, [debouncedSearch, filterCategories, load])

  const handleCategoriesChange = (cats: CategoryOption[]) => {
    setFilterCategories(cats)
    setPage(1)
  }

  const add = async () => {
    if (!form.name) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, categoryIds: form.categories.map(c => c.id) }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create tag'); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    toast.success('Tag created')
    load(1, debouncedSearch, filterCategories)
  }

  const startEdit = (t: TagWithCats) => {
    setEditId(t.id)
    setEditForm({
      name: t.name, color: t.color, description: t.description,
      categories: t.categories?.map(c => c.category) ?? [],
    })
  }

  const commitEdit = async () => {
    if (!editId) return
    const res = await fetch(`/api/tags/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, categoryIds: (editForm.categories ?? []).map(c => c.id) }),
    })
    const updated = await res.json()
    if (!res.ok) { toast.error(updated.error ?? 'Failed to update tag'); return }
    setEditId(null)
    toast.success('Tag updated')
    load(page, debouncedSearch, filterCategories)
  }

  const toggleActive = async (t: TagWithCats) => {
    await fetch(`/api/tags/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    setTags(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x))
  }

  const remove = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    toast.success('Tag deleted')
    load(page, debouncedSearch, filterCategories)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const bulkSetActive = async (active: boolean) => {
    if (!selected.size) return
    setBulkBusy(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/tags/bulk', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) { toast.error('Bulk update failed'); return }
      setTags(prev => prev.map(t => selected.has(t.id) ? { ...t, active } : t))
      toast.success(`${ids.length} tag(s) ${active ? 'enabled' : 'disabled'}`)
      setSelected(new Set())
    } finally { setBulkBusy(false) }
  }

  const goPage = (p: number) => load(p, debouncedSearch, filterCategories)
  const hasActiveFilters = filterCategories.length > 0

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tags</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {total > 0 ? `${total} tag${total !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}` : 'Interests used for LLM categorization'}
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }}>+ Add</Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search tags…"
          className="max-w-xs h-8 text-sm"
        />
      </div>

      <FilterBar
        selectedCategories={filterCategories}
        onCategoriesChange={handleCategoriesChange}
      />

      {showForm && (
        <TagForm form={form} onFormChange={setForm} onSave={add} onCancel={() => setShowForm(false)} />
      )}

      <BulkActionBar
        count={selected.size} busy={bulkBusy}
        onEnable={() => bulkSetActive(true)} onDisable={() => bulkSetActive(false)}
        onClear={() => setSelected(new Set())}
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[88px] w-full bg-zinc-900" />)}
        </div>
      ) : tags.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">🏷️</EmptyMedia>
            <EmptyTitle>{search || hasActiveFilters ? 'No tags match your filters' : 'No tags yet'}</EmptyTitle>
            <EmptyDescription>Add your interests so the pipeline can categorize articles.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {tags.map(tag =>
              editId === tag.id ? (
                <TagEditCard
                  key={tag.id}
                  form={editForm}
                  onFormChange={setEditForm}
                  onSave={commitEdit}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <TagCard
                  key={tag.id}
                  tag={tag}
                  selected={selected.has(tag.id)}
                  onToggleSelect={() => toggleSelect(tag.id)}
                  onToggleActive={() => toggleActive(tag)}
                  onEdit={() => startEdit(tag)}
                  onRemove={() => remove(tag.id)}
                />
              )
            )}
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
