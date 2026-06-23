type SectionCardProps = {
  title: string
  accent: string
  children: React.ReactNode
}

export function SectionCard({ title, accent, children }: SectionCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className={`px-5 py-3 border-b border-zinc-800 text-xs font-medium tracking-widest uppercase ${accent}`}>
        {title}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}