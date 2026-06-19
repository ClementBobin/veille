import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const RegisterBody = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .openapi('RegisterBody')