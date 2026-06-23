import type { MaskPattern } from '@/components/ui/mask-input'

/**
 * Builds a MaskPattern that performs no character-level masking (transform is
 * an identity function) but still plugs into MaskInput's onValidate / invalid
 * machinery via a custom `validate` predicate. Useful for fields that need
 * MaskInput's validation UX (email, password rules, source URLs) without an
 * actual input mask/pattern.
 */
export function passthroughMask(maxLength: number, validate: (value: string) => boolean): MaskPattern {
  return {
    pattern: '#'.repeat(maxLength),
    transform: (value: string) => value,
    validate: (value: string) => validate(value),
  }
}

export const emailMask = passthroughMask(254, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))

export const passwordMask = (minLength: number) => passthroughMask(64, (v) => v.length >= minLength)