import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const IdParam = z.object({ id: z.string() })
export const DigestStatus = z.enum(['PENDING', 'SELECTED', 'DONE'])

export const SourceType = z.enum([
  'RSS',
  'SCRAPING',
  'VIDEO',
  'AUDIO',
  'SOCIAL',
  'NEWSLETTER',
  'FILE',
  'WEBHOOK',
])


export const ApiKeySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    lastUsed: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi('ApiKey')

export const SourceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    type: SourceType,
    active: z.boolean(),
    cache: z.boolean(),
    lastFetch: z.string().datetime().nullable(),
    userId: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('Source')

export const TagInFeedItem = z.object({
  tag: z.object({ id: z.string(), name: z.string(), color: z.string() }),
})


export const FeedItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
    content: z.string().nullable(),
    sourceId: z.string(),
    userId: z.string(),
    relevant: z.boolean(),
    processed: z.boolean(),
    score: z.number(),
    publishedAt: z.string().datetime().nullable(),
    fetchedAt: z.string().datetime(),
    tags: z.array(TagInFeedItem),
  })
  .openapi('FeedItem')

export const TagSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.string().openapi({ example: '#6366f1' }),
    description: z.string().nullable(),
    userId: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi('Tag')

export const DigestSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    status: DigestStatus,
    userId: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi('Digest')

export const NoteSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    filename: z.string().nullable(),
    exportedTo: z.string(),
    digestId: z.string().nullable(),
    userId: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi('Note')

export const PipelineEventSchema = z
  .object({
    id: z.string(),
    workflow: z.string().openapi({ example: 'WF1' }),
    status: z.string().openapi({ example: 'done' }),
    message: z.string().nullable(),
    runId: z.string().nullable(),
    branch: z.string().nullable(),
    userId: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi('PipelineEvent')
