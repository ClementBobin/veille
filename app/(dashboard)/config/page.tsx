'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type ApiKey = { id: string; name: string; lastUsed: string | null; createdAt: string }
type Config = { N8N_BASE_URL?: string; N8N_WEBHOOK_PATH?: string; RETENTION_DAYS?: string }
type CleanupInfo = { cutoff: string; eligibleForCleanup: number; retentionDays: number }
type ImportResult = { ok: boolean; imported: Record<string, number> } | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className={`px-5 py-3 border-b border-zinc-800 text-xs font-medium tracking-widest uppercase ${accent}`}>
        {title}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({
  label, hint, value, onChange, placeholder, type = 'text',
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-400 font-medium">{label}</label>
      {hint && <div className="text-[11px] text-zinc-600">{hint}</div>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  )
}

// ─── Delete account modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function confirm() {
    if (step < 3) { setStep(s => s + 1); return }
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
        setError(d.error ?? 'Erreur inconnue')
      } else {
        onDeleted()
      }
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ['Êtes-vous sûr ?', 'Vraiment sûr ?', 'Confirmer définitivement']
  const stepColors = ['text-amber-400', 'text-orange-400', 'text-red-400']
  const btnColors = ['bg-amber-600 hover:bg-amber-500', 'bg-orange-600 hover:bg-orange-500', 'bg-red-600 hover:bg-red-500']

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-96 shadow-xl">
        <div className={`text-sm font-bold mb-1 ${stepColors[step - 1]}`}>
          Étape {step}/3 — {stepLabels[step - 1]}
        </div>
        <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
          {step === 1 && 'Cette action supprimera définitivement votre compte, toutes vos sources, articles, digests, notes et clés API.'}
          {step === 2 && "Toutes vos données seront effacées de façon irréversible. Il n'y a aucun moyen de les récupérer."}
          {step === 3 && 'Entrez votre mot de passe pour confirmer la suppression définitive de votre compte.'}
        </p>
        {step === 3 && (
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe actuel"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-red-500 mb-3 transition-colors"
            autoFocus
          />
        )}
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={confirm}
            disabled={loading || (step === 3 && !password)}
            className={`flex-1 text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-40 ${btnColors[step - 1]}`}
          >
            {loading ? 'Suppression…' : step < 3 ? 'Continuer →' : 'Supprimer définitivement'}
          </button>
          <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const router = useRouter()

  // Config state
  const [config, setConfig] = useState<Config>({})
  const [configDraft, setConfigDraft] = useState<Config>({})
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // API keys state
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [keyLoading, setKeyLoading] = useState(false)

  // Cleanup state
  const [cleanupInfo, setCleanupInfo] = useState<CleanupInfo | null>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; cutoff: string } | null>(null)

  // Export / Import state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Delete account
  const [showDelete, setShowDelete] = useState(false)

  // Load
  const load = useCallback(async () => {
    const [cfgRes, keysRes, cleanupRes] = await Promise.all([
      fetch('/api/system/config'),
      fetch('/api/auth/keys'),
      fetch('/api/system/cleanup'),
    ])
    const cfg: Config = await cfgRes.json()
    const ks: ApiKey[] = await keysRes.json()
    const cl: CleanupInfo = await cleanupRes.json()
    setConfig(cfg)
    setConfigDraft(cfg)
    setKeys(ks)
    setCleanupInfo(cl)
  }, [])

  useEffect(() => { load() }, [load])

  // Config save
  async function saveConfig() {
    setConfigSaving(true)
    setConfigSaved(false)
    await fetch('/api/system/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configDraft),
    })
    setConfig(configDraft)
    setConfigSaving(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2500)
    const cl: CleanupInfo = await fetch('/api/system/cleanup').then(r => r.json())
    setCleanupInfo(cl)
  }

  const configChanged = JSON.stringify(config) !== JSON.stringify(configDraft)

  // API key creation
  async function createKey() {
    if (!newKeyName.trim()) return
    setKeyLoading(true)
    const res = await fetch('/api/auth/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    const data = await res.json()
    setCreatedKey(data.key)
    setNewKeyName('')
    const ks: ApiKey[] = await fetch('/api/auth/keys').then(r => r.json())
    setKeys(ks)
    setKeyLoading(false)
  }

  async function revokeKey(id: string) {
    await fetch('/api/auth/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  // Cleanup
  async function runCleanup(dryRun: boolean) {
    setCleanupLoading(true)
    setCleanupResult(null)
    const res = await fetch(`/api/system/cleanup${dryRun ? '?dryRun=true' : ''}`, { method: dryRun ? 'GET' : 'DELETE' })
    const data = await res.json()
    if (!dryRun) {
      setCleanupResult({ deleted: data.deleted, cutoff: data.cutoff })
      const cl: CleanupInfo = await fetch('/api/system/cleanup').then(r => r.json())
      setCleanupInfo(cl)
    } else {
      setCleanupInfo(prev => prev ? { ...prev, eligibleForCleanup: data.count } : prev)
    }
    setCleanupLoading(false)
  }

  // Import
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setImportError(null)
    try {
      const text = await file.text()
      const res = await fetch('/api/system/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      })
      const data = await res.json()
      if (!res.ok) setImportError(data.error ?? 'Erreur inconnue')
      else setImportResult(data)
    } catch {
      setImportError('Fichier invalide ou erreur réseau')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // Logout
  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <div className="max-w-full">
      {showDelete && (
        <DeleteAccountModal
          onClose={() => setShowDelete(false)}
          onDeleted={() => router.push('/login')}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-zinc-500 text-sm mt-1">Configuration du pipeline, accès API et gestion du compte</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── n8n config ── */}
        <Section title="Pipeline n8n" accent="text-indigo-400">
          <div className="flex flex-col gap-4">
            <Field
              label="URL de base n8n"
              hint="Adresse de ton instance n8n"
              value={configDraft.N8N_BASE_URL ?? ''}
              onChange={v => setConfigDraft(d => ({ ...d, N8N_BASE_URL: v }))}
              placeholder="http://localhost:5678"
            />
            <Field
              label="Chemin webhook"
              hint="Segment après l'URL de base (webhook ou webhook-test)"
              value={configDraft.N8N_WEBHOOK_PATH ?? ''}
              onChange={v => setConfigDraft(d => ({ ...d, N8N_WEBHOOK_PATH: v }))}
              placeholder="webhook-test"
            />
            <Field
              label="Rétention des articles (jours)"
              hint="Articles plus anciens que cette durée seront éligibles au nettoyage"
              value={configDraft.RETENTION_DAYS ?? ''}
              onChange={v => setConfigDraft(d => ({ ...d, RETENTION_DAYS: v }))}
              placeholder="7"
              type="number"
            />
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveConfig}
                disabled={!configChanged || configSaving}
                className="text-xs font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {configSaving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
              {configSaved && <span className="text-xs text-emerald-400">✓ Sauvegardé</span>}
              {!configChanged && !configSaved && (
                <span className="text-xs text-zinc-600">Aucune modification</span>
              )}
            </div>
          </div>
        </Section>

        {/* ── Cleanup ── */}
        <Section title="Nettoyage des articles" accent="text-amber-400">
          {cleanupInfo && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-950 rounded-lg">
              <div>
                <div className="text-2xl font-bold text-amber-400">{cleanupInfo.eligibleForCleanup}</div>
                <div className="text-xs text-zinc-500">articles éligibles</div>
              </div>
              <div className="text-xs text-zinc-600 leading-relaxed">
                Rétention active : <span className="text-zinc-400">{cleanupInfo.retentionDays} jours</span><br />
                Cutoff : <span className="text-zinc-400">{new Date(cleanupInfo.cutoff).toLocaleDateString('fr', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          )}
          {cleanupResult && (
            <div className="mb-4 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-2">
              ✓ {cleanupResult.deleted} article(s) supprimé(s)
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => runCleanup(false)}
              disabled={cleanupLoading || cleanupInfo?.eligibleForCleanup === 0}
              className="text-xs font-medium px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cleanupLoading ? 'En cours…' : 'Lancer le nettoyage'}
            </button>
            <button
              onClick={() => runCleanup(true)}
              disabled={cleanupLoading}
              className="text-xs px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              Aperçu (dry-run)
            </button>
          </div>
        </Section>

        {/* ── Export / Import ── */}
        <Section title="Export / Import" accent="text-sky-400">
          <div className="flex flex-col gap-5">

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300 font-medium mb-1">Exporter vos données</div>
                <div className="text-xs text-zinc-600">
                  Télécharge un fichier JSON contenant toutes vos sources, articles, digests et notes.
                </div>
              </div>
              <a
                href="/api/system/export"
                download
                className="text-xs font-medium px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-white transition-colors flex-shrink-0"
              >
                ↓ Télécharger
              </a>
            </div>

            <div className="border-t border-zinc-800" />

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300 font-medium mb-1">Importer des données</div>
                <div className="text-xs text-zinc-600">
                  Fusionne un export JSON dans votre compte. Les enregistrements existants sont mis à jour.
                </div>
              </div>
              <label className={`text-xs font-medium px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0 cursor-pointer ${importing ? 'opacity-40 pointer-events-none' : ''}`}>
                {importing ? 'Import…' : '↑ Importer'}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>

            {importError && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                ✗ {importError}
              </div>
            )}

            {importResult && (
              <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-2 flex flex-col gap-1">
                <span className="font-medium">✓ Import terminé</span>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-emerald-500/80 mt-1">
                  {Object.entries(importResult.imported).map(([k, v]) => (
                    <span key={k}>{k} : {v}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </Section>

        {/* ── API Keys ── */}
        <Section title="Clés API" accent="text-purple-400">
          {createdKey && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
              <div className="text-xs text-emerald-400 font-medium mb-1">✓ Clé créée — copiez-la maintenant, elle ne sera plus affichée</div>
              <div className="font-mono text-xs text-emerald-300 break-all bg-zinc-950 px-3 py-2 rounded-md mt-2 select-all">
                {createdKey}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(createdKey) }}
                className="mt-2 text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Copier →
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              placeholder="Nom de la clé (ex: n8n-prod)"
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={createKey}
              disabled={!newKeyName.trim() || keyLoading}
              className="text-xs font-medium px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white transition-colors disabled:opacity-40"
            >
              {keyLoading ? '…' : 'Créer'}
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="text-xs text-zinc-600 py-4 text-center">Aucune clé API active</div>
          ) : (
            <div className="flex flex-col gap-2">
              {keys.map(k => (
                <div key={k.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-950 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 font-medium">{k.name}</div>
                    <div className="text-[11px] text-zinc-600 mt-0.5">
                      Créée le {fmt(k.createdAt)}
                      {k.lastUsed && <> · Dernière utilisation {fmt(k.lastUsed)}</>}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="text-xs px-3 py-1 rounded-md border border-zinc-700 text-zinc-500 hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    Révoquer
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Account ── */}
        <Section title="Compte" accent="text-zinc-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-300 font-medium mb-1">Session</div>
              <div className="text-xs text-zinc-600">Déconnexion de l'interface web uniquement. Les clés API restent actives.</div>
            </div>
            <button
              onClick={logout}
              className="text-xs px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              Se déconnecter
            </button>
          </div>
          <div className="border-t border-zinc-800 mt-5 pt-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-red-400 font-medium mb-1">Zone de danger</div>
              <div className="text-xs text-zinc-600">Suppression définitive du compte et de toutes les données associées.</div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              className="text-xs px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              Supprimer le compte
            </button>
          </div>
        </Section>

      </div>
    </div>
  )
}