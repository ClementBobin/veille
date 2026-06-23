'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { DigestTabsList } from '@/components/selection/digest-tabs'
import { DigestCard } from '@/components/selection/digest-card'
import type { Digest } from '@/types'

export default function SelectionPage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<Record<string, boolean>>({})

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
    try {
      const res = await fetch('/api/digest/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId: activeId, selectedSubjectIds: [...selected] }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setDone((prev) => ({ ...prev, [activeId]: true }))
      toast.success('Saved — WF5 triggered')
    } catch (e: any) {
      toast.error(e.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64 bg-zinc-800" />
        <Skeleton className="h-4 w-48 bg-zinc-800" />
        <Skeleton className="h-48 w-full bg-zinc-800 mt-4" />
        <Skeleton className="h-48 w-full bg-zinc-800" />
      </div>
    )
  }

  if (digests.length === 0)
    return (
      <Empty className="py-24">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-transparent text-4xl">📭</EmptyMedia>
          <EmptyTitle>No pending digest</EmptyTitle>
          <EmptyDescription>The n8n pipeline needs to run first.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Today&apos;s selection</h1>
          {digest && (
            <p className="text-zinc-500 text-sm mt-1">
              {new Date(digest.date).toLocaleDateString('en', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              {' · '}
              {selected.size} / {digest.subjects.length} subjects selected
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {digest && !done[activeId!] && (
            <button
              onClick={toggleAll}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {digest.subjects.every((s) => selected.has(s.id)) ? 'Deselect all' : 'Select all'}
            </button>
          )}
          {done[activeId!] ? (
            <div className="bg-emerald-500/10 text-emerald-400 text-xs px-4 py-2 rounded-lg">
              ✓ Saved — WF5 triggered
            </div>
          ) : (
            <Button
              onClick={save}
              disabled={selected.size === 0 || saving}
              className={
                selected.size > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }
            >
              {saving && <Spinner className="mr-1" />}
              {saving ? 'Saving…' : 'Generate note →'}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeId ?? undefined} onValueChange={setActiveId}>
        <DigestTabsList digests={digests} doneMap={done} />
        {digests.map((d) => (
          <TabsContent key={d.id} value={d.id}>
            <DigestCard digest={d} selected={selections[d.id] ?? new Set()} onToggle={toggle} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}