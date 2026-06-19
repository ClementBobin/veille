import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const IngestItemBody = z
  .object({
    title: z.string(),
    url: z.string().url(),
    content: z.string().optional(),
    sourceId: z.string(),
    publishedAt: z.string().datetime().optional(),
  })
  .openapi('IngestItemBody')
 
export const IngestBody = z
  .union([IngestItemBody, z.array(IngestItemBody)])
  .openapi('IngestBody')
 
export const IngestResponse = z
  .object({ created: z.number().int(), total: z.number().int() })
  .openapi('IngestResponse')
