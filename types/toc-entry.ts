import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const TocEntryInput = z
  .object({
    title: z.string(),
    summary: z.string().optional(),
    articleIds: z.array(z.string()).optional(),
  })
  .openapi('TocEntryInput')
