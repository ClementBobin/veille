import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import '../globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Veille Manager',
  description: 'Gestionnaire de veille informatique',
}

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/sources', label: 'Sources' },
  { href: '/tags', label: 'Tags' },
  { href: '/selection', label: 'Sélection' },
  { href: '/notes', label: 'Notes' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col">
        <header className="border-b border-zinc-800 px-6 h-14 flex items-center gap-6 sticky top-0 bg-zinc-950 z-50">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">⚡</div>
            <span className="font-bold text-sm tracking-tight">veille<span className="text-indigo-400">.io</span></span>
          </div>
          <nav className="flex gap-1">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-500">n8n actif</span>
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
