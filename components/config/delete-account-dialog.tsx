'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type DeleteAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

const STEP_LABELS = ['Are you sure?', 'Really sure?', 'Confirm permanently']
const STEP_COLORS = ['text-amber-400', 'text-orange-400', 'text-red-400']
const BTN_COLORS = ['bg-amber-600 hover:bg-amber-500', 'bg-orange-600 hover:bg-orange-500', 'bg-red-600 hover:bg-red-500']

export function DeleteAccountDialog({ open, onOpenChange, onDeleted }: DeleteAccountDialogProps) {
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() {
    setStep(1)
    setPassword('')
    setError('')
  }

  async function confirm() {
    if (step < 3) {
      setStep(s => s + 1)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm: 'DELETE MY ACCOUNT' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Unknown error')
        toast.error(d.error ?? 'Unknown error')
      } else {
        toast.success('Account deleted')
        onDeleted()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <AlertDialogContent className="bg-zinc-900 border-red-500/30">
        <AlertDialogHeader>
          <AlertDialogTitle className={STEP_COLORS[step - 1]}>
            Step {step}/3 — {STEP_LABELS[step - 1]}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-500 leading-relaxed">
            {step === 1 && 'This will permanently delete your account, including all your sources, articles, digests, notes and API keys.'}
            {step === 2 && 'All your data will be erased irreversibly. There is no way to recover it.'}
            {step === 3 && 'Enter your password to confirm permanent account deletion.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 3 && (
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Current password"
            autoFocus
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <AlertDialogFooter>
          <Button
            onClick={confirm}
            disabled={loading || (step === 3 && !password)}
            className={`text-white ${BTN_COLORS[step - 1]}`}
          >
            {loading && <Spinner className="mr-1" />}
            {loading ? 'Deleting…' : step < 3 ? 'Continue →' : 'Delete permanently'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}