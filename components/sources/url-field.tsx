'use client'
import { useMemo } from 'react'
import { MaskInput } from '@/components/ui/mask-input'
import { Button } from '@/components/ui/button'
import { validateUrl, type SourceTypeMeta } from '@/hooks/use-source-types'
import { passthroughMask } from '@/lib/mask-presets'

type UrlFieldProps = {
  value: string
  onChange: (v: string) => void
  meta?: SourceTypeMeta
}

export function UrlField({ value, onChange, meta }: UrlFieldProps) {
  const error = validateUrl(value, meta)

  // Reuses MaskInput's validation machinery (instead of plain Input) so the
  // field gets the same invalid/aria-invalid styling driven by each source
  // type's own URL pattern, without constraining what characters can be typed.
  const mask = useMemo(() => {
    if (!meta?.urlPattern) return undefined
    let regex: RegExp | null = null
    try {
      regex = new RegExp(meta.urlPattern)
    } catch {
      regex = null
    }
    return passthroughMask(2000, (v) => (regex ? regex.test(v) : true))
  }, [meta?.urlPattern])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <MaskInput
          value={value}
          onValueChange={(masked) => onChange(masked)}
          mask={mask}
          withoutMask={!mask}
          placeholder={meta?.urlPlaceholder ?? 'https://...'}
          invalid={!!error}
          className="flex-1"
        />
        {meta?.urlTemplate && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange(meta.urlTemplate!)}
            className="flex-shrink-0 whitespace-nowrap"
          >
            {meta.urlTemplateLabel ?? '+ Template'}
          </Button>
        )}
      </div>
      {meta?.urlHint && !error && (
        <div className="text-[11px] text-zinc-600">{meta.urlHint}</div>
      )}
      {error && <div className="text-[11px] text-red-400">{error}</div>}
    </div>
  )
}