'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
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
      setError(data.error ?? 'Une erreur est survenue')
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-white mb-2">Créer un compte</h1>

        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="input-base" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required minLength={8} className="input-base" />
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" required minLength={8} className="input-base" />

        {error && <div className="text-xs text-red-400">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-40">
          {loading ? 'Création…' : 'Créer le compte'}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Déjà un compte ? <Link href="/login" className="text-indigo-400 underline">Se connecter</Link>
        </p>

        <style>{`
          .input-base { background:#09090b;border:1px solid #3f3f46;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;color:#f4f4f5;width:100%;outline:none; }
          .input-base:focus { border-color:#6366f1; }
          .input-base::placeholder { color:#52525b; }
          .btn-primary { background:#4f46e5;color:white;font-size:0.8rem;padding:0.6rem 1rem;border-radius:0.5rem;border:none;cursor:pointer; }
          .btn-primary:hover { background:#6366f1; }
        `}</style>
      </form>
    </div>
  )
}