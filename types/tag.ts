import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const CreateTagBody = z
  .object({
    name: z.string().min(1),
    color: z.string().default('#6366f1'),
    description: z.string().optional(),
  })
  .openapi('CreateTagBody')
 
export const PatchTagBody = z
  .object({
    name: z.string().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
  })
  .openapi('PatchTagBody')
