import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const CreatePipelineEventBody = z
  .object({
    workflow: z.string().openapi({ example: 'WF1' }),
    status: z.string().openapi({ example: 'branch-done' }),
    message: z.string().optional(),
    runId: z.string().optional(),
    branch: z.string().optional(),
  })
  .openapi('CreatePipelineEventBody')
