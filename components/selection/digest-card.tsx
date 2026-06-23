import type { Digest } from '@/types'
import { SubjectItem } from './subject-item'

type DigestCardProps = {
  digest: Digest
  selected: Set<string>
  onToggle: (subjectId: string) => void
}

export function DigestCard({ digest, selected, onToggle }: DigestCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-800">
        {digest.title && (
          <h2 className="text-base font-semibold text-white mb-1">{digest.title}</h2>
        )}
        {digest.summary && (
          <p className="text-xs text-zinc-500 leading-relaxed">{digest.summary}</p>
        )}
      </div>

      <div className="divide-y divide-zinc-800">
        {digest.subjects
          .sort((a, b) => a.order - b.order)
          .map((s, i) => {
            const tocEntry = digest.toc.find(
              (t) => t.order === s.order || t.title.toLowerCase() === s.title.toLowerCase()
            )
            return (
              <SubjectItem
                key={s.id}
                subject={s}
                index={i}
                isSelected={selected.has(s.id)}
                tocEntry={tocEntry}
                onToggle={() => onToggle(s.id)}
              />
            )
          })}
      </div>
    </div>
  )
}