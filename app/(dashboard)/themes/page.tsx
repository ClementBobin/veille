'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ThemeForm, themeToForm, EMPTY_THEME_FORM, type ThemeFormState } from '@/components/themes/theme-form'
import { ThemeCard } from '@/components/themes/theme-card'
import type { Theme } from '@/types'

const PAGE_SIZE = 6

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ThemeFormState>(EMPTY_THEME_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ThemeFormState>(EMPTY_THEME_FORM)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    fetch('/api/themes')
      .then(r => r.json())
      .then(setThemes)
      .finally(() => setLoading(false))
  }, [])

  const pages = Math.max(1, Math.ceil(themes.length / PAGE_SIZE))
  const visibleThemes = useMemo(
    () => themes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [themes, page],
  )

  const add = async () => {
    if (!form.title) return
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        validationCriteria: form.validationCriteria || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create theme')
      return
    }
    setThemes(prev => [data, ...prev])
    setForm(EMPTY_THEME_FORM)
    setShowForm(false)
    toast.success('Theme created')
  }

  const startEdit = (t: Theme) => {
    setEditId(t.id)
    setEditForm(themeToForm(t))
  }

  const commitEdit = async () => {
    if (!editId) return
    const res = await fetch(`/api/themes/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        description: editForm.description || null,
        validationCriteria: editForm.validationCriteria || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update theme')
      return
    }
    setThemes(prev => prev.map(t => (t.id === editId ? data : t)))
    setEditId(null)
    toast.success('Theme updated')
  }

  const toggleActive = async (t: Theme) => {
    const res = await fetch(`/api/themes/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    if (!res.ok) {
      toast.error('Failed to update theme')
      return
    }
    setThemes(prev => prev.map(x => (x.id === t.id ? { ...x, active: !x.active } : x)))
  }

  const remove = async (id: string) => {
    await fetch(`/api/themes/${id}`, { method: 'DELETE' })
    setThemes(prev => prev.filter(t => t.id !== id))
    setSelected(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    toast.success('Theme deleted')
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
      const res = await fetch('/api/themes/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) {
        toast.error('Bulk update failed')
        return
      }
      setThemes(prev => prev.map(t => (selected.has(t.id) ? { ...t, active } : t)))
      toast.success(`${ids.length} theme(s) ${active ? 'enabled' : 'disabled'}`)
      setSelected(new Set())
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Themes</h1>
          <p className="text-zinc-500 text-sm mt-1">Subjects used by the LLM to select and group relevant articles</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }}>
          + Add
        </Button>
      </div>

      {showForm && (
        <ThemeForm
          form={form}
          onFormChange={setForm}
          onSave={add}
          onCancel={() => setShowForm(false)}
          submitLabel="Create theme"
        />
      )}

      <BulkActionBar
        count={selected.size}
        busy={bulkBusy}
        onEnable={() => bulkSetActive(true)}
        onDisable={() => bulkSetActive(false)}
        onClear={() => setSelected(new Set())}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full bg-zinc-900" />
          ))}
        </div>
      ) : themes.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">🗂️</EmptyMedia>
            <EmptyTitle>No themes yet</EmptyTitle>
            <EmptyDescription>
              Add themes to help the LLM understand what subjects to track and how to validate articles.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visibleThemes.map(theme =>
              editId === theme.id ? (
                <ThemeForm
                  key={theme.id}
                  form={editForm}
                  onFormChange={setEditForm}
                  onSave={commitEdit}
                  onCancel={() => setEditId(null)}
                  submitLabel="Save changes"
                />
              ) : (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={selected.has(theme.id)}
                  onToggleSelect={() => toggleSelect(theme.id)}
                  onToggleActive={() => toggleActive(theme)}
                  onEdit={() => startEdit(theme)}
                  onRemove={() => remove(theme.id)}
                />
              ),
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