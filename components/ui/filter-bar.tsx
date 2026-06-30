'use client'

import { X } from 'lucide-react'
import { CategoryPicker, type CategoryOption } from '@/components/categories/category-picker'
import { TagPicker, type TagOption } from '@/components/tags/tag-picker'

type FilterBarProps = {
  /** Show tag filter (only on themes) */
  withTags?: boolean
  selectedCategories: CategoryOption[]
  onCategoriesChange: (cats: CategoryOption[]) => void
  selectedTags?: TagOption[]
  onTagsChange?: (tags: TagOption[]) => void
}

export function FilterBar({
  withTags = false,
  selectedCategories,
  onCategoriesChange,
  selectedTags = [],
  onTagsChange,
}: FilterBarProps) {
  const hasFilters = selectedCategories.length > 0 || selectedTags.length > 0

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className={`grid gap-2 ${withTags ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
        <div>
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
            Filter by category
          </p>
          <CategoryPicker
            value={selectedCategories}
            onChange={cats => { onCategoriesChange(cats) }}
            placeholder="All categories…"
          />
        </div>
        {withTags && onTagsChange && (
          <div>
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
              Filter by tag
            </p>
            <TagPicker
              value={selectedTags}
              onChange={onTagsChange}
              placeholder="All tags…"
            />
          </div>
        )}
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => { onCategoriesChange([]); onTagsChange?.([]) }}
          className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors self-start"
        >
          <X className="w-3 h-3" />
          Clear filters
        </button>
      )}
    </div>
  )
}
