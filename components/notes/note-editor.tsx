'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import ObsidianRenderer from '@/components/ui/ObsidianRenderer'
import { NoteDetailHeader } from './note-detail-header'

type Note = { id: string; title: string; content: string; filename: string; exportedTo: string }

export function NoteEditor({ note: initial }: { note: Note }) {
  const [note, setNote] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initial.title)
  const [content, setContent] = useState(initial.content)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save note')
        return
      }
      setNote(data)
      setEditing(false)
      toast.success('Note saved')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setTitle(note.title)
    setContent(note.content)
    setEditing(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-lg font-bold bg-zinc-950 border-zinc-700 flex-1"
              placeholder="Title"
            />
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" onClick={save} disabled={saving || !title}>
                {saving && <Spinner className="mr-1" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel} className="text-zinc-500">
                Cancel
              </Button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full min-h-[400px] bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="Markdown content…"
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-6">
            <NoteDetailHeader title={note.title} filename={note.filename} exportedTo={note.exportedTo} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="ml-4 flex-shrink-0 text-zinc-400 hover:text-zinc-200"
            >
              Edit
            </Button>
          </div>
          <ObsidianRenderer content={note.content} />
        </>
      )}
    </div>
  )
}
