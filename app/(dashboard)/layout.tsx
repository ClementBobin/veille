'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar'
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { AppTour } from '@/components/app-tour'

const NAV = [
  { href: '/', label: 'Dashboard', id: 'nav-dashboard' },
  { href: '/sources', label: 'Sources', id: 'nav-sources' },
  { href: '/tags', label: 'Tags', id: 'nav-tags' },
  { href: '/selection', label: 'Selection', id: 'nav-selection' },
  { href: '/notes', label: 'Notes', id: 'nav-notes' },
  { href: '/logs', label: 'Logs', id: 'nav-logs' },
  { href: '/config', label: 'Settings', id: 'nav-config' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tourOpen, setTourOpen] = useState(false)

  return (
    <>
      <header className="border-b border-zinc-800 px-6 h-14 flex items-center gap-6 sticky top-0 bg-zinc-950 z-50">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">⚡</div>
          <span className="font-bold text-sm tracking-tight">watch<span className="text-indigo-400">.io</span></span>
        </div>

        <Menubar className="border-none bg-transparent p-0 h-auto gap-1">
          {NAV.map(({ href, label, id }) => (
            <MenubarMenu key={href}>
              <MenubarTrigger
                id={id}
                asChild
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 data-[state=open]:bg-zinc-800"
              >
                <Link href={href}>{label}</Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
        </Menubar>

        <div className="ml-auto flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button id="nav-help" variant="ghost" size="sm" onClick={() => setTourOpen(true)}>
                ? Help
              </Button>
            </TooltipTrigger>
            <TooltipContent>Take a quick tour of the app</TooltipContent>
          </Tooltip>

          <Status variant="success">
            <StatusIndicator />
            <StatusLabel>n8n active</StatusLabel>
          </Status>
        </div>
      </header>

      <AppTour open={tourOpen} onOpenChange={setTourOpen} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </>
  )
}