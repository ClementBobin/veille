'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function submit() {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) router.push('/')
    else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Identifiants incorrects')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-80">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">⚡</div>
          <span className="font-bold text-sm tracking-tight text-white">veille<span className="text-indigo-400">.io</span></span>
        </div>
        <h1 className="text-lg font-bold text-white mb-6">Connexion</h1>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Mot de passe"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 mb-3"
        />
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <button onClick={submit}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
          Se connecter
        </button>
        <p className="text-xs text-zinc-500 text-center mt-4">
          Pas encore de compte ? <Link href="/register" className="text-indigo-400 underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}