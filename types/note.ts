import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const CreateNoteBody = z
  .object({
    title: z.string(),
    content: z.string(),
    digestId: z.string().optional(),
    filename: z.string().optional(),
    exportedTo: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .openapi('CreateNoteBody')
