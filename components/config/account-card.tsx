'use client'

import { Button } from '@/components/ui/button'
import { SectionCard } from './section-card'

type AccountCardProps = {
  onLogout: () => void
  onDeleteClick: () => void
}

export function AccountCard({ onLogout, onDeleteClick }: AccountCardProps) {
  return (
    <SectionCard title="Account" accent="text-zinc-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-zinc-300 font-medium mb-1">Session</div>
          <div className="text-xs text-zinc-600">Signs you out of the web interface only. API keys stay active.</div>
        </div>
        <Button variant="outline" onClick={onLogout} className="flex-shrink-0">
          Sign out
        </Button>
      </div>
      <div className="border-t border-zinc-800 mt-5 pt-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-red-400 font-medium mb-1">Danger zone</div>
          <div className="text-xs text-zinc-600">Permanently deletes the account and all associated data.</div>
        </div>
        <Button
          variant="destructive"
          onClick={onDeleteClick}
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 flex-shrink-0"
        >
          Delete account
        </Button>
      </div>
    </SectionCard>
  )
}