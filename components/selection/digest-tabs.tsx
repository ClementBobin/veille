import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Digest } from '@/types'

type DigestTabsListProps = {
  digests: Digest[]
  doneMap: Record<string, boolean>
}

export function DigestTabsList({ digests, doneMap }: DigestTabsListProps) {
  if (digests.length <= 1) return null

  return (
    <TabsList
      variant="line"
      className="mb-4 w-full justify-start border-b border-zinc-800 rounded-none bg-transparent overflow-x-auto"
    >
      {digests.map((d, i) => (
        <TabsTrigger key={d.id} value={d.id} className="flex-shrink-0 text-xs whitespace-nowrap">
          {d.title ?? `Digest #${i + 1}`}
          {doneMap[d.id] && <span className="ml-1.5 text-emerald-400">✓</span>}
          <span className="ml-2 text-zinc-600">
            {new Date(d.date).toLocaleDateString('en', { day: '2-digit', month: 'short' })}
          </span>
        </TabsTrigger>
      ))}
    </TabsList>
  )
}