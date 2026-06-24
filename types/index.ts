export type ApiKey = { id: string; name: string; lastUsed: string | null; createdAt: string }
export type Config = {
  N8N_BASE_URL?: string
  N8N_WEBHOOK_PATH?: string
  RETENTION_DAYS?: string
}
export type Webhook = {
  id: string
  name: string
  url: string
  events: string
  active: boolean
  lastTriggeredAt: string | null
  lastStatus: string | null
  createdAt: string
}
export type CleanupInfo = { cutoff: string; eligibleForCleanup: number; retentionDays: number }
export type ImportResult = { ok: boolean; imported: Record<string, number> } | null
export type Tag = { id: string; name: string; color: string; description?: string; active: boolean }
export type Source = {
  id: string
  name: string
  url: string
  type: string
  active: boolean
  cache: boolean
  lastFetch: string | null
}
export type FeedItem = { id: string; title: string; url: string }
export type TocArticle = { tocEntryId: string; feedItemId: string; feedItem: FeedItem }
export type TocEntry = { id: string; order: number; title: string; summary: string; articles: TocArticle[] }
export type Subject = { id: string; title: string; summary: string; selected: boolean; order: number }
export type Digest = {
  id: string
  date: string
  title: string | null
  summary: string | null
  status: string
  subjects: Subject[]
  toc: TocEntry[]
}
export type Note = { id: string; title: string; filename: string; exportedTo: string; createdAt: string }
export type Log = {
  id: string
  method: string
  path: string
  status: number
  durationMs: number
  authType: string | null
  apiKeyName: string | null
  error: string | null
  createdAt: string
}

export type LogsResponse = { logs: Log[]; total: number; page: number; pages: number; limit: number }