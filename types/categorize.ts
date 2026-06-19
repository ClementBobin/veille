import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { FeedItemSchema } from '.'

extendZodWithOpenApi(z)

export const CategorizeBody = z
  .object({
    feedItemId: z.string(),
    tags: z.array(z.string()).default([]),
    score: z.number().default(0),
    relevant: z.boolean().default(false),
  })
  .openapi('CategorizeBody')
 
export const CategorizeResponse = z
  .union([
    FeedItemSchema,
    z.object({ skipped: z.literal(true), reason: z.literal('tags_unchanged') }),
  ])
  .openapi('CategorizeResponse')
