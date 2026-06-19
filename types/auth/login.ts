import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const LoginBody = z
  .object({
    email: z.string().email(),
    password: z.string(),
  })
  .openapi('LoginBody')