/**
 * Webhook scope & event system.
 *
 * Webhooks subscribe to SCOPES and/or individual EVENTS.
 * The `events` DB column stores a comma-separated mix of both.
 *
 * Dispatch checks: does this webhook subscribe to either the specific event
 * OR the scope that contains it?
 */

export const WEBHOOK_SCOPES = [
  {
    value: 'articles:write',
    label: 'Articles',
    description: 'Raw article ingestion, categorization and processing',
    events: ['article.created', 'article.categorized', 'article.processed'] as const,
  },
  {
    value: 'tags:write',
    label: 'Tags',
    description: 'Tag create, update, delete and bulk changes',
    events: ['tag.created', 'tag.updated', 'tag.deleted', 'tag.bulk_updated'] as const,
  },
  {
    value: 'sources:write',
    label: 'Sources',
    description: 'Source create, update, delete and bulk changes',
    events: ['source.created', 'source.updated', 'source.deleted', 'source.bulk_updated'] as const,
  },
  {
    value: 'themes:write',
    label: 'Themes',
    description: 'Theme create, update and delete',
    events: ['theme.created', 'theme.updated', 'theme.deleted'] as const,
  },
  {
    value: 'categories:write',
    label: 'Categories',
    description: 'Category create, update and delete',
    events: ['category.created', 'category.updated', 'category.deleted'] as const,
  },
  {
    value: 'notes:write',
    label: 'Notes',
    description: 'Note create and update',
    events: ['note.created', 'note.updated'] as const,
  },
  {
    value: 'digest:write',
    label: 'Digest',
    description: 'Digest created and subjects selected',
    events: ['digest.created', 'digest.selection'] as const,
  },
  {
    value: 'pipeline:write',
    label: 'Pipeline',
    description: 'Pipeline events from n8n workflows',
    events: ['pipeline-event'] as const,
  },
  {
    value: 'prompts:write',
    label: 'Prompts',
    description: 'LLM prompt create, update and delete',
    events: ['prompt.created', 'prompt.updated', 'prompt.deleted'] as const,
  },
  {
    value: 'cleanup:run',
    label: 'Cleanup',
    description: 'Scheduled cleanup runs',
    events: ['cleanup.run'] as const,
  },
] as const

export type WebhookScope = typeof WEBHOOK_SCOPES[number]['value']
export type WebhookEvent = typeof WEBHOOK_SCOPES[number]['events'][number]

export const WEBHOOK_SCOPE_VALUES = WEBHOOK_SCOPES.map(s => s.value) as WebhookScope[]

/** All events across all scopes */
export const ALL_WEBHOOK_EVENTS: string[] = WEBHOOK_SCOPES.flatMap(s => [...s.events])

/** scope → events[] */
export const SCOPE_EVENTS: Record<WebhookScope, readonly string[]> = Object.fromEntries(
  WEBHOOK_SCOPES.map(s => [s.value, s.events])
) as unknown as Record<WebhookScope, readonly string[]>

/** event → parent scope */
export const EVENT_SCOPE: Record<string, WebhookScope> = Object.fromEntries(
  WEBHOOK_SCOPES.flatMap(s => s.events.map(e => [e, s.value]))
) as Record<string, WebhookScope>

/**
 * Given an event string, return true if the subscriber token matches.
 * A subscriber matches if it contains:
 *  - the exact event name  ("article.created"), OR
 *  - the parent scope      ("articles:write")
 */
export function subscriberMatchesEvent(subscriptions: string[], event: string): boolean {
  const parentScope = EVENT_SCOPE[event]
  return subscriptions.some(s => s === event || s === parentScope)
}

/**
 * Parse and validate a raw comma-separated subscriptions string.
 * Accepts a mix of scope values and event names. Unknown tokens are dropped.
 */
export function parseSubscriptions(raw: string): string[] {
  const valid = new Set([...WEBHOOK_SCOPE_VALUES, ...ALL_WEBHOOK_EVENTS])
  return raw.split(',').map(s => s.trim()).filter(s => valid.has(s))
}

/**
 * Normalize an array of subscription tokens (scopes and/or events).
 * Falls back to all scopes if nothing valid is provided.
 */
export function normalizeScopes(input: unknown): string {
  if (!Array.isArray(input) || input.length === 0) return WEBHOOK_SCOPE_VALUES.join(',')
  const valid = new Set([...WEBHOOK_SCOPE_VALUES, ...ALL_WEBHOOK_EVENTS])
  const filtered = input.filter((s): s is string => typeof s === 'string' && valid.has(s))
  return (filtered.length ? filtered : WEBHOOK_SCOPE_VALUES).join(',')
}

/** Parse stored scopes string into array (alias for parseSubscriptions) */
export const parseScopes = parseSubscriptions
