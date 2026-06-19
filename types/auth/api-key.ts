import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

  export const CreateApiKeyBody = z
  .object({ name: z.string().min(1) })
  .openapi('CreateApiKeyBody')
 
export const CreatedApiKeyResponse = z
  .object({ key: z.string(), name: z.string() })
  .openapi('CreatedApiKeyResponse', {
    description: 'Raw key — store it now, it will not be shown again',
  })
 
export const DeleteApiKeyBody = z
  .object({ id: z.string() })
  .openapi('DeleteApiKeyBody')
