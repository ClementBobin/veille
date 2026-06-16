import NotesClient from './NotesClient'

export default async function NotesPage() {
  const notes = await fetch('/api/notes', { cache: 'no-store' }).then(r => r.json())
  return <NotesClient notes={notes} />
}