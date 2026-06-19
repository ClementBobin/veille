import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const ConfigPatchBody = z
  .object({
    N8N_BASE_URL: z.string().url().optional().openapi({ example: 'http://localhost:5678' }),
    N8N_WEBHOOK_PATH: z.string().optional().openapi({ example: 'webhook-test' }),
    RETENTION_DAYS: z.string().optional().openapi({ example: '30' }),
  })
  .openapi('ConfigPatchBody')
 
export const CleanupPreviewResponse = z
  .object({
    cutoff: z.string().datetime(),
    eligibleForCleanup: z.number().int(),
    retentionDays: z.number().int(),
  })
  .openapi('CleanupPreviewResponse')
 
export const DeleteAccountBody = z
  .object({
    password: z.string(),
    confirm: z.literal('DELETE MY ACCOUNT'),
  })
  .openapi('DeleteAccountBody')