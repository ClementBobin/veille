'use client'
import { useEffect, useState } from 'react'

export type SourceTypeTemplate = {
  label: string
  value: string
}

export type SourceTypeMeta = {
  value: string
  label: string
  color: string
  icon: string
  cacheSupported: boolean
  urlPlaceholder: string
  urlHint?: string
  urlPattern?: string
  urlTemplate?: string
  urlTemplateLabel?: string
  urlTemplates?: SourceTypeTemplate[]
}

export function useSourceTypes() {
  const [types, setTypes] = useState<SourceTypeMeta[]>([])
  useEffect(() => {
    fetch('/api/sources/type').then(r => r.json()).then(setTypes)
  }, [])
  return types
}

export function getMeta(types: SourceTypeMeta[], typeValue: string): SourceTypeMeta | undefined {
  return types.find(t => t.value === typeValue)
}

export function validateUrl(url: string, meta?: SourceTypeMeta): string | null {
  if (!url) return null
  if (meta?.urlPattern) {
    try {
      if (!new RegExp(meta.urlPattern).test(url)) return `Invalid URL for type ${meta.label}`
    } catch {}
  }
  return null
}