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
import {
  ColorPicker, ColorPickerTrigger, ColorPickerContent,
  ColorPickerArea, ColorPickerHueSlider, ColorPickerSwatch, ColorPickerInput,
} from '@/components/ui/color-picker'
import { useDebounce } from '@/hooks/use-debouncer'

type Category = {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  _count: { tagLinks: number; sourceLinks: number; themeLinks: number }
}

type FormState = { name: string; description: string; color: string }
const EMPTY_FORM: FormState = { name: '', description: '', color: '#a78bfa' }
const PAGE_SIZE = 12

function CategoryRow({
  cat, onEdit, onDelete,
}: {
  cat: Category
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}) {
  const linked = cat._count.tagLinks + cat._count.sourceLinks + cat._count.themeLinks
  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 group">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
          <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5">{linked} linked</span>
        </div>
        {cat.description && (
          <p className="text-xs text-zinc-600 truncate mt-0.5">{cat.description}</p>
        )}
      </div>

      <div className="text-[10px] text-zinc-700 flex gap-3 flex-shrink-0">
        {cat._count.tagLinks > 0 && <span>{cat._count.tagLinks} tag{cat._count.tagLinks !== 1 ? 's' : ''}</span>}
        {cat._count.sourceLinks > 0 && <span>{cat._count.sourceLinks} source{cat._count.sourceLinks !== 1 ? 's' : ''}</span>}
        {cat._count.themeLinks > 0 && <span>{cat._count.themeLinks} theme{cat._count.themeLinks !== 1 ? 's' : ''}</span>}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon-sm" variant="ghost" onClick={() => onEdit(cat)} className="text-zinc-600 hover:text-zinc-300">✏️</Button>
        <Button size="icon-sm" variant="ghost" onClick={() => onDelete(cat.id)} className="text-zinc-700 hover:text-red-400 text-lg leading-none">×</Button>
      </div>
    </div>
  )
}

function CategoryForm({
  form, onFormChange, onSave, onCancel, title,
}: {
  form: FormState
  onFormChange: (f: FormState) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-3">
      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
      <div className="flex items-center gap-3">
        <ColorPicker value={form.color} onValueChange={c => onFormChange({ ...form, color: c })}>
          <ColorPickerTrigger asChild>
            <Button variant="outline" size="sm" className="px-2 flex-shrink-0">
              <ColorPickerSwatch className="size-4" />
            </Button>
          </ColorPickerTrigger>
          <ColorPickerContent>
            <ColorPickerArea />
            <ColorPickerHueSlider />
            <ColorPickerInput withoutAlpha />
          </ColorPickerContent>
        </ColorPicker>
        <Input
          value={form.name}
          onChange={e => onFormChange({ ...form, name: e.target.value })}
          placeholder="Category name *"
          className="flex-1"
        />
        <Input
          value={form.description}
          onChange={e => onFormChange({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          className="flex-1"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={!form.name.trim()}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/categories?page=${p}&limit=${PAGE_SIZE}&search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCategories(data.categories)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1, debouncedSearch) }, [debouncedSearch, load])

  const create = async () => {
    const res = await fetch('/api/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create category'); return }
    setForm(EMPTY_FORM); setShowForm(false)
    toast.success('Category created')
    load(1, debouncedSearch)
  }

  const startEdit = (cat: Category) => {
    setEditId(cat.id)
    setEditForm({ name: cat.name, description: cat.description ?? '', color: cat.color })
    setShowForm(false)
  }

  const commitEdit = async () => {
    if (!editId) return
    const res = await fetch(`/api/categories/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to update category'); return }
    setEditId(null)
    toast.success('Category updated')
    load(page, debouncedSearch)
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete category'); return }
    toast.success('Category deleted')
    load(page, debouncedSearch)
  }

  const goPage = (p: number) => load(p, debouncedSearch)

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {total > 0
              ? `${total} categor${total !== 1 ? 'ies' : 'y'} — classify sources, tags and themes`
              : 'Group sources, tags and themes by topic or domain'}
          </p>
        </div>
        <Button onClick={() => { setShowForm(v => !v); setEditId(null) }}>+ Add</Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search categories…"
          className="max-w-xs h-8 text-sm"
        />
      </div>

      {showForm && (
        <CategoryForm
          form={form} onFormChange={setForm} title="New category"
          onSave={create} onCancel={() => setShowForm(false)}
        />
      )}

      {editId && (
        <CategoryForm
          form={editForm} onFormChange={setEditForm} title="Edit category"
          onSave={commitEdit} onCancel={() => setEditId(null)}
        />
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[60px] w-full bg-zinc-900" />)}
        </div>
      ) : categories.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">🗂️</EmptyMedia>
            <EmptyTitle>{search ? 'No categories match' : 'No categories yet'}</EmptyTitle>
            <EmptyDescription>Create categories to organise your sources, tags and themes.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <CategoryRow key={cat.id} cat={cat} onEdit={startEdit} onDelete={remove} />
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