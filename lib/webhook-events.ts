export const WEBHOOK_EVENTS = [
  { value: 'pipeline-event', label: 'Pipeline events', hint: 'Every collect/categorize/digest pipeline-event' },
  { value: 'note.created', label: 'Note created', hint: 'Every time a note is posted' },
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]['value']

export const WEBHOOK_EVENT_VALUES = WEBHOOK_EVENTS.map(e => e.value)

/** Validates a requested event list against the known event types, falling back to "all" if empty/invalid. */
export function normalizeEvents(events: unknown): string {
  if (!Array.isArray(events) || events.length === 0) return WEBHOOK_EVENT_VALUES.join(',')
  const valid = events.filter((e): e is string => typeof e === 'string' && (WEBHOOK_EVENT_VALUES as readonly string[]).includes(e))
  return (valid.length ? valid : WEBHOOK_EVENT_VALUES).join(',')
}