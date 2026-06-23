'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup } from '@/components/ui/field'
import { MaskInput } from '@/components/ui/mask-input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { emailMask } from '@/lib/mask-presets'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailValid, setEmailValid] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit() {
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Card className="w-80 bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">⚡</div>
            <span className="font-bold text-sm tracking-tight text-white">veille<span className="text-indigo-400">.io</span></span>
          </div>
          <h1 className="text-lg font-bold text-white mb-6">Sign in</h1>

          <FieldGroup>
            <Field>
              <MaskInput
                mask={emailMask}
                value={email}
                onValueChange={(masked) => setEmail(masked)}
                onValidate={(valid) => setEmailValid(valid)}
                invalid={!emailValid && email.length > 0}
                placeholder="Email"
              />
            </Field>
            <Field>
              <MaskInput
                type="password"
                withoutMask
                value={password}
                onValueChange={(v) => setPassword(v)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Password"
              />
            </Field>
          </FieldGroup>

          <Button onClick={submit} disabled={loading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500">
            {loading && <Spinner className="mr-1" />}
            Sign in
          </Button>

          <p className="text-xs text-zinc-500 text-center mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}