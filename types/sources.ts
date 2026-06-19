import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { SourceType } from '.'
import { z } from 'zod'
 
extendZodWithOpenApi(z)

export const CreateSourceBody = z
  .object({
    name: z.string().min(1),
    url: z.string().url(),
    type: SourceType,
    cache: z.boolean().default(false),
  })
  .openapi('CreateSourceBody')

export const PatchSourceBody = z
  .object({
    name: z.string().optional(),
    url: z.string().url().optional(),
    type: SourceType.optional(),
    active: z.boolean().optional(),
    cache: z.boolean().optional(),
  })
  .openapi('PatchSourceBody')
