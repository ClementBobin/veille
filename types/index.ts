export type ApiKey = { id: string; name: string; lastUsed: string | null; createdAt: string }

/** Parses a comma-separated or JSON-array string into a string[].
 *  Falls back to an empty array for empty/invalid input. */
export function toArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    // not JSON — fall through to comma-split
  }
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export type Config = {
  N8N_BASE_URL?: string
  N8N_WEBHOOK_PATH?: string
  RETENTION_DAYS?: string
  THEME?: string
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

export type Theme = {
  id: string
  userId: string
  title: string
  description: string | null
  tags: string // JSON array string
  active: boolean
  validationCriteria: string | null
  createdAt: string
  updatedAt: string
}

export type WebhookLog = {
  id: string
  event: string
  ok: boolean
  status: number | null
  error: string | null
  isTest: boolean
  durationMs: number | null
  createdAt: string
}
export type CleanupInfo = { cutoff: string; eligibleForCleanup: number; retentionDays: number }
export type EntityStats = { created: number; updated: number; skipped: number }
export type ImportResult = { ok: boolean; imported: Record<string, EntityStats>; totals: Record<string, number> } | null
export type Tag = { id: string; name: string; color: string; description?: string; active: boolean }
export type Category = {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
}
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