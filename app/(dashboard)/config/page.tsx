'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { N8nPipelineCard } from '@/components/config/n8n-pipeline-card'
import { WebhooksCard } from '@/components/config/webhooks-card'
import { CleanupCard } from '@/components/config/cleanup-card'
import { ExportImportCard } from '@/components/config/export-import-card'
import { ApiKeysCard } from '@/components/config/api-keys-card'
import { AccountCard } from '@/components/config/account-card'
import { DeleteAccountDialog } from '@/components/config/delete-account-dialog'
import { CleanupMode, type CleanupInfo, type CleanupResult } from '@/types/cleanup'
import { type ApiKey, type Config, type ImportResult } from '@/types'

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
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)

  // Export / Import state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Delete account
  const [showDelete, setShowDelete] = useState(false)

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
    toast.success('Configuration saved')
    setTimeout(() => setConfigSaved(false), 2500)
    const cl: CleanupInfo = await fetch('/api/system/cleanup').then(r => r.json())
    setCleanupInfo(cl)
  }

  const configChanged = JSON.stringify(config) !== JSON.stringify(configDraft)

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
    toast.success('API key created')
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
    toast.success('API key revoked')
  }

  // Updated cleanup function using enum
  async function runCleanup(mode: CleanupMode) {
    setCleanupLoading(true)
    setCleanupResult(null)

    const isDryRun = mode === CleanupMode.DRY_RUN || mode === CleanupMode.DRY_RUN_FORCED
    const isForced = mode === CleanupMode.FORCED || mode === CleanupMode.DRY_RUN_FORCED
    
    const params = new URLSearchParams()
    if (isDryRun) params.set('dryRun', 'true')
    if (isForced) params.set('forced', 'true')
    
    const queryString = params.toString()
    const url = `/api/system/cleanup${queryString ? `?${queryString}` : ''}`
    
    const res = await fetch(url, { method: isDryRun ? 'GET' : 'DELETE' })
    const data = await res.json()

    if (isDryRun) {
      // Dry run result
      setCleanupResult({
        ...data,
        dryRun: true,
        mode,
      })
      toast.info(`Preview: ${data.count} articles would be deleted`)
    } else {
      // Actual cleanup result
      setCleanupResult({
        ...data,
        dryRun: false,
        mode,
      })
      toast.success(`${data.deleted} article(s) deleted (${mode})`)
      // Refresh cleanup info
      const cl: CleanupInfo = await fetch('/api/system/cleanup').then(r => r.json())
      setCleanupInfo(cl)
    }
    
    setCleanupLoading(false)
  }

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
      if (!res.ok) {
        setImportError(data.error ?? 'Unknown error')
        toast.error(data.error ?? 'Import failed')
      } else {
        setImportResult(data)
        toast.success('Import complete')
      }
    } catch {
      setImportError('Invalid file or network error')
      toast.error('Invalid file or network error')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    toast.success('Signed out')
    router.push('/login')
  }

  return (
    <div className="max-w-full">
      <DeleteAccountDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onDeleted={() => router.push('/login')}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Pipeline configuration, API access and account management</p>
      </div>

      <div className="flex flex-col gap-5">
        <N8nPipelineCard
          draft={configDraft}
          onDraftChange={setConfigDraft}
          changed={configChanged}
          saving={configSaving}
          saved={configSaved}
          onSave={saveConfig}
        />

        <WebhooksCard />

        <CleanupCard
          info={cleanupInfo}
          result={cleanupResult}
          loading={cleanupLoading}
          onRun={runCleanup}
        />

        <ExportImportCard
          importing={importing}
          importResult={importResult}
          importError={importError}
          onImport={handleImport}
        />

        <ApiKeysCard
          keys={keys}
          createdKey={createdKey}
          newKeyName={newKeyName}
          onNewKeyNameChange={setNewKeyName}
          keyLoading={keyLoading}
          onCreate={createKey}
          onRevoke={revokeKey}
        />

        <AccountCard onLogout={logout} onDeleteClick={() => setShowDelete(true)} />
      </div>
    </div>
  )
}