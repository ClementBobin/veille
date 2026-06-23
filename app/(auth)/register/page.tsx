'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldDescription } from '@/components/ui/field'
import { MaskInput } from '@/components/ui/mask-input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { emailMask, passwordMask } from '@/lib/mask-presets'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordValid, setPasswordValid] = useState(true)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Something went wrong')
      return
    }

    toast.success('Account created')
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-xl font-bold text-white mb-2">Create an account</h1>

            <FieldGroup>
              <Field>
                <MaskInput mask={emailMask} value={email} onValueChange={setEmail} placeholder="Email" required />
              </Field>
              <Field>
                <MaskInput
                  type="password"
                  mask={passwordMask(8)}
                  value={password}
                  onValueChange={setPassword}
                  onValidate={setPasswordValid}
                  invalid={!passwordValid && password.length > 0}
                  placeholder="Password"
                  required
                />
                <FieldDescription>At least 8 characters</FieldDescription>
              </Field>
              <Field>
                <MaskInput
                  type="password"
                  withoutMask
                  value={confirm}
                  onValueChange={setConfirm}
                  placeholder="Confirm password"
                  required
                />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40">
              {loading && <Spinner className="mr-1" />}
              {loading ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-xs text-zinc-500 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}