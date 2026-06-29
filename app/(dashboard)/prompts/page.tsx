'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

type PromptRole = 'system' | 'assistant' | 'user'

type PromptMessage = {
  id?: string
  role: PromptRole
  content: string
  order: number
}

type Prompt = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  messages: PromptMessage[]
}

type FormState = {
  name: string
  description: string
  messages: { role: PromptRole; content: string }[]
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  messages: [{ role: 'system', content: '' }],
}

const ROLES: { value: PromptRole; label: string; color: string }[] = [
  { value: 'system', label: 'System', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
  { value: 'assistant', label: 'Assistant', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'user', label: 'User', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
]

function RoleBadge({ role }: { role: PromptRole }) {
  const meta = ROLES.find(r => r.value === role)
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta?.color ?? ''}`}>
      {meta?.label ?? role}
    </span>
  )
}

function MessageEditor({
  messages,
  onChange,
}: {
  messages: { role: PromptRole; content: string }[]
  onChange: (msgs: { role: PromptRole; content: string }[]) => void
}) {
  const update = (i: number, patch: Partial<{ role: PromptRole; content: string }>) => {
    const next = messages.map((m, idx) => idx === i ? { ...m, ...patch } : m)
    onChange(next)
  }

  const add = () => onChange([...messages, { role: 'user', content: '' }])
  const remove = (i: number) => onChange(messages.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...messages]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg, i) => (
        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update(i, { role: r.value })}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                    msg.role === r.value
                      ? r.color
                      : 'text-zinc-600 border-zinc-800 bg-transparent hover:border-zinc-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-zinc-600 hover:text-zinc-400 disabled:opacity-20 text-sm px-1"
              >↑</button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === messages.length - 1}
                className="text-zinc-600 hover:text-zinc-400 disabled:opacity-20 text-sm px-1"
              >↓</button>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={messages.length === 1}
                className="text-zinc-600 hover:text-red-400 disabled:opacity-20 text-sm px-1"
              >×</button>
            </div>
          </div>
          <textarea
            value={msg.content}
            onChange={e => update(i, { content: e.target.value })}
            placeholder={`${msg.role === 'system' ? 'System instruction…' : msg.role === 'assistant' ? 'Assistant response…' : 'User message…'}`}
            rows={msg.role === 'system' ? 5 : 3}
            className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-700 resize-y focus:outline-none font-mono leading-relaxed"
          />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={add} className="self-start">
        + Add message
      </Button>
    </div>
  )
}

function PromptForm({
  form, onChange, onSave, onCancel, title,
}: {
  form: FormState
  onChange: (f: FormState) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-5 space-y-4">
      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-zinc-500 mb-1.5 block">Name * (used in API lookups)</Label>
          <Input
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. categorization-system"
            className="font-mono"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-500 mb-1.5 block">Description</Label>
          <Input
            value={form.description}
            onChange={e => onChange({ ...form, description: e.target.value })}
            placeholder="What this prompt does"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-zinc-500 mb-1.5 block">Messages</Label>
        <MessageEditor
          messages={form.messages}
          onChange={messages => onChange({ ...form, messages })}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.name.trim() || form.messages.every(m => !m.content.trim())}>
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function PromptCard({
  prompt, onEdit, onDelete,
}: {
  prompt: Prompt
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-zinc-200 font-mono">{prompt.name}</span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5">
              {prompt.messages.length} message{prompt.messages.length !== 1 ? 's' : ''}
            </span>
          </div>
          {prompt.description && (
            <p className="text-xs text-zinc-500">{prompt.description}</p>
          )}
          <div className="flex gap-1 mt-2 flex-wrap">
            {prompt.messages.map((m, i) => (
              <RoleBadge key={i} role={m.role as PromptRole} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm" variant="ghost"
            onClick={() => setExpanded(v => !v)}
            className="text-zinc-600 hover:text-zinc-300 text-xs"
          >
            {expanded ? 'Collapse' : 'Preview'}
          </Button>
          <Button
            size="icon-sm" variant="ghost"
            onClick={onEdit}
            className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100"
          >✏️</Button>
          <Button
            size="icon-sm" variant="ghost"
            onClick={onDelete}
            className="text-zinc-700 hover:text-red-400 text-lg leading-none"
          >×</Button>
        </div>
      </div>

      {/* Preview panel */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 flex flex-col gap-2">
          {prompt.messages.map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
              <RoleBadge role={m.role as PromptRole} />
              <pre className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-zinc-800">
                {m.content}
              </pre>
            </div>
          ))}
          {/* API usage hint */}
          <div className="mt-2 text-[10px] text-zinc-700 font-mono bg-zinc-950 rounded px-2 py-1.5">
            GET /api/prompts/by-name/{prompt.name}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompts')
      setPrompts(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    const res = await fetch('/api/prompts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create prompt'); return }
    setForm(EMPTY_FORM); setShowForm(false)
    toast.success('Prompt created')
    load()
  }

  const startEdit = (p: Prompt) => {
    setEditId(p.id)
    setEditForm({
      name: p.name,
      description: p.description ?? '',
      messages: p.messages.map(m => ({ role: m.role as PromptRole, content: m.content })),
    })
    setShowForm(false)
  }

  const commitEdit = async () => {
    if (!editId) return
    const res = await fetch(`/api/prompts/${editId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to update prompt'); return }
    setEditId(null)
    toast.success('Prompt updated')
    load()
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete prompt'); return }
    toast.success('Prompt deleted')
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">LLM Prompts</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {prompts.length > 0
              ? `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} — fetch by name via API`
              : 'Reusable prompt templates for your n8n LLM nodes'}
          </p>
        </div>
        <Button onClick={() => { setShowForm(v => !v); setEditId(null) }}>+ Add</Button>
      </div>

      {showForm && (
        <PromptForm
          form={form} onChange={setForm} title="New prompt"
          onSave={create} onCancel={() => setShowForm(false)}
        />
      )}

      {editId && (
        <PromptForm
          form={editForm} onChange={setEditForm} title="Edit prompt"
          onSave={commitEdit} onCancel={() => setEditId(null)}
        />
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-zinc-900" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-transparent text-3xl">🤖</EmptyMedia>
            <EmptyTitle>No prompts yet</EmptyTitle>
            <EmptyDescription>
              Create named prompt templates and fetch them from n8n via{' '}
              <code className="font-mono text-zinc-400">GET /api/prompts/by-name/:name</code>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {prompts.map(p => (
            <PromptCard
              key={p.id} prompt={p}
              onEdit={() => startEdit(p)}
              onDelete={() => remove(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
