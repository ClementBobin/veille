import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ObsidianRenderer from '@/components/ui/ObsidianRenderer'
import { NoteDetailHeader } from '@/components/notes/note-detail-header'

type Note = { id: string; title: string; content: string; filename: string; exportedTo: string }

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
      <Button asChild variant="outline" size="sm" className="mb-6">
        <Link href="/notes">← Back</Link>
      </Button>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <NoteDetailHeader title={note.title} filename={note.filename} exportedTo={note.exportedTo} />
        <ObsidianRenderer content={note.content} />
      </div>
    </div>
  )
}