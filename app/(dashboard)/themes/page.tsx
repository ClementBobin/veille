'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext,
} from '@/components/ui/pagination'
import { ThemeForm, type ThemeFormState } from '@/components/themes/theme-form'
import { ThemeCard } from '@/components/themes/theme-card'
import { FilterBar } from '@/components/ui/filter-bar'
import { useDebounce } from '@/hooks/use-debouncer'
import type { Theme } from '@/types'
import type { CategoryOption } from '@/components/categories/category-picker'
import type { TagOption } from '@/components/tags/tag-picker'

type ThemeWithCats = Theme & { categories?: { category: CategoryOption }[] }

const EMPTY_FORM: ThemeFormState = {
  title: '', description: '', tags: [], validationCriteria: '', active: true, categories: [],
}
const PAGE_SIZE = 8

function parseTagsField(raw: string): TagOption[] {
  try {
    const names: string[] = JSON.parse(raw)
    return names.map(name => ({ id: name, name, color: '#6366f1' }))
  } catch {
    return []
  }
}

function serializeTags(tags: TagOption[]): string {
  return JSON.stringify(tags.map(t => t.name))
}

function buildUrl(p: number, q: string, categories: CategoryOption[], tags: TagOption[]) {
  const params = new URLSearchParams()
  params.set('page', String(p))
  params.set('limit', String(PAGE_SIZE))
  if (q) params.set('search', q)
  categories.forEach(c => params.append('categoryId', c.id))
  tags.forEach(t => params.append('tag', t.name))
  return `/api/themes?${params.toString()}`
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<ThemeWithCats[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filterCategories, setFilterCategories] = useState<CategoryOption[]>([])
  const [filterTags, setFilterTags] = useState<TagOption[]>([])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ThemeFormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ThemeFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p: number, q: string, cats: CategoryOption[], tags: TagOption[]) => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl(p, q, cats, tags))
      const data = await res.json()
      setThemes(data.themes)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1, debouncedSearch, filterCategories, filterTags) }, [debouncedSearch, filterCategories, filterTags, load])

  const handleCategoriesChange = (cats: CategoryOption[]) => {
    setFilterCategories(cats)
    setPage(1)
  }

  const handleTagsChange = (tags: TagOption[]) => {
    setFilterTags(tags)
    setPage(1)
  }

  const add = async () => {
    if (!form.title.trim()) return
    const res = await fetch('/api/themes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        tags: serializeTags(form.tags),
        validationCriteria: form.validationCriteria,
        active: form.active,
        categoryIds: form.categories.map(c => c.id),
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create theme'); return }
    setForm(EMPTY_FORM); setShowForm(false)
    toast.success('Theme created')
    load(1, debouncedSearch, filterCategories, filterTags)
  }

  const startEdit = (t: ThemeWithCats) => {
    setEditId(t.id)
    setEditForm({
      title: t.title,
      description: t.description ?? '',
      tags: parseTagsField(t.tags),
      validationCriteria: t.validationCriteria ?? '',
      active: t.active,
      categories: t.categories?.map(c => c.category) ?? [],
    })
    setShowForm(false)
  }

  const commitEdit = async () => {
    if (!editId) return
    const res = await fetch(`/api/themes/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        tags: serializeTags(editForm.tags),
        validationCriteria: editForm.validationCriteria,
        active: editForm.active,
        categoryIds: editForm.categories.map(c => c.id),
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to update theme'); return }
    setEditId(null)
    toast.success('Theme updated')
    load(page, debouncedSearch, filterCategories, filterTags)
  }

  const toggleActive = async (t: ThemeWithCats) => {
    await fetch(`/api/themes/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    setThemes(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x))
  }

  const remove = async (id: string) => {
    await fetch(`/api/themes/${id}`, { method: 'DELETE' })
    toast.success('Theme deleted')
    load(page, debouncedSearch, filterCategories, filterTags)
  }

  const goPage = (p: number) => load(p, debouncedSearch, filterCategories, filterTags)

  const hasActiveFilters = filterCategories.length > 0 || filterTags.length > 0

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Themes</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {total > 0 ? `${total} theme${total !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}` : 'Watch topics used by the AI categorization pipeline'}
          </p>
        </div>
        <Button onClick={() => { setShowForm(v => !v); setEditId(null) }}>+ Add</Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search themes…"
          className="max-w-xs h-8 text-sm"
        />
      </div>

      <FilterBar
        withTags
        selectedCategories={filterCategories}
        onCategoriesChange={handleCategoriesChange}
        selectedTags={filterTags}
        onTagsChange={handleTagsChange}
      />

      {showForm && (
        <ThemeForm form={form} onFormChange={setForm} onSave={add} onCancel={() => setShowForm(false)} />
      )}

      {editId && (
        <div className="mb-5">
          <h2 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Editing theme</h2>
          <ThemeForm
            form={editForm}
            onFormChange={setEditForm}
            onSave={commitEdit}
            onCancel={() => setEditId(null)}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] w-full bg-zinc-900" />)}
        </div>
      ) : themes.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">🎯</EmptyMedia>
            <EmptyTitle>{search || hasActiveFilters ? 'No themes match your filters' : 'No themes yet'}</EmptyTitle>
            <EmptyDescription>Define watch topics for the AI to use during categorization.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(t => (
              <ThemeCard
                key={t.id} theme={t}
                onToggleActive={() => toggleActive(t)}
                onEdit={() => startEdit(t)}
                onRemove={() => remove(t.id)}
              />
            ))}
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
