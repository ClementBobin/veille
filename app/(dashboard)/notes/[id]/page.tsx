import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ObsidianRenderer from '@/components/ui/ObsidianRenderer'

type Note = { id: string; title: string; content: string; filename: string; exportedTo: string }

const toArray = (v: string) => v ? v.split(',') : []

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/notes/${id}`, {
    headers: { Cookie: `session=${session}` },
    cache: 'no-store',
  })

  if (res.status === 404) notFound()
  const note: Note = await res.json()

  return (
    <div>
      <Link href="/notes"
        className="border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors mb-6 inline-block">
        ← Retour
      </Link>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">{note.title}</h2>
            <div className="text-xs text-zinc-600 font-mono mt-1">{note.filename}</div>
          </div>
          <div className="flex gap-2">
            {toArray(note.exportedTo).map(e => (
              <span key={e} className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded">{e}</span>
            ))}
          </div>
        </div>
        <ObsidianRenderer content={note.content} />
      </div>
    </div>
  )
}