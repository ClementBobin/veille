'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'
import { TagForm, type TagFormState } from '@/components/tags/tag-form'
import { TagEditCard } from '@/components/tags/tag-edit-card'
import { TagCard } from '@/components/tags/tag-card'
import type { Tag } from '@/types'

const EMPTY_FORM: TagFormState = { name: '', color: '#6366f1', description: '' }
const PAGE_SIZE = 8

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TagFormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Tag>>({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags).finally(() => setLoading(false))
  }, [])

  const pages = Math.max(1, Math.ceil(tags.length / PAGE_SIZE))
  const visibleTags = useMemo(
    () => tags.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [tags, page],
  )

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
    toast.success('Tag created')
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
    toast.success('Tag updated')
  }

  const remove = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    setTags(tags.filter((t) => t.id !== id))
    toast.success('Tag deleted')
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tags</h1>
          <p className="text-zinc-500 text-sm mt-1">Interests used for LLM categorization</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }}>
          + Add
        </Button>
      </div>

      {showForm && (
        <TagForm form={form} onFormChange={setForm} onSave={add} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full bg-zinc-900" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">🏷️</EmptyMedia>
            <EmptyTitle>No tags yet</EmptyTitle>
            <EmptyDescription>Add your interests so the pipeline can categorize articles.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {visibleTags.map((tag) =>
              editId === tag.id ? (
                <TagEditCard
                  key={tag.id}
                  form={editForm}
                  onFormChange={setEditForm}
                  onSave={commitEdit}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <TagCard key={tag.id} tag={tag} onEdit={() => startEdit(tag)} onRemove={() => remove(tag.id)} />
              )
            )}
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