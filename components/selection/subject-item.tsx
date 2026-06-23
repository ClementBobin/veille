import type { Subject, TocEntry } from '@/types'

type SubjectItemProps = {
  subject: Subject
  index: number
  isSelected: boolean
  tocEntry?: TocEntry
  onToggle: () => void
}

export function SubjectItem({ subject, index, isSelected, tocEntry, onToggle }: SubjectItemProps) {
  return (
    <div
      onClick={onToggle}
      className={`px-6 py-4 flex gap-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-950/20' : 'hover:bg-zinc-800/50'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700'
        }`}
      >
        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-zinc-600">#{index + 1}</span>
          <span className={`text-sm font-medium ${isSelected ? 'text-indigo-300' : 'text-zinc-200'}`}>
            {subject.title}
          </span>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed mb-2">{subject.summary}</p>

        {tocEntry?.articles.length ? (
          <div className="flex flex-wrap gap-2">
            {tocEntry.articles.map((a) => (
              <a
                key={a.feedItemId}
                href={a.feedItem.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                ↗ {a.feedItem.title}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}