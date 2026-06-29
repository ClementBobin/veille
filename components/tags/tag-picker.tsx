'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/use-debouncer'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { X } from 'lucide-react'

export type TagOption = {
  id: string
  name: string
  color: string
  description?: string | null
}

type TagPickerProps = {
  value: TagOption[]
  onChange: (tags: TagOption[]) => void
  placeholder?: string
}

export function TagPicker({ value, onChange, placeholder = 'Search tags…' }: TagPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TagOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const selectedIds = new Set(value.map(v => v.id))
    fetch(`/api/tags?search=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((data: TagOption[] | { tags: TagOption[] }) => {
        const tags = Array.isArray(data) ? data : (data.tags ?? [])
        setResults(tags.filter(t => !selectedIds.has(t.id)))
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery, open, value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (tag: TagOption) => {
    onChange([...value, tag])
    setQuery('')
    setResults(prev => prev.filter(t => t.id !== tag.id))
  }

  const remove = (id: string) => onChange(value.filter(t => t.id !== id))

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border"
              style={{ borderColor: tag.color + '55', background: tag.color + '18', color: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                className="opacity-60 hover:opacity-100 leading-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-3 text-zinc-500">
              <Spinner className="w-4 h-4" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-3 px-3 text-xs text-zinc-600">
              {query ? 'No tags match' : 'No tags available — create some in the Tags page'}
            </div>
          ) : (
            results.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => select(tag)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors text-left"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: tag.color }}
                />
                <span className="text-zinc-200 flex-1">{tag.name}</span>
                {tag.description && (
                  <span className="text-zinc-600 truncate max-w-[160px]">{tag.description}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
