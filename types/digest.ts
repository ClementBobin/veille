import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { DigestStatus } from '.'
import { TocEntryInput } from './toc-entry'

extendZodWithOpenApi(z)

export const DigestSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    status: DigestStatus,
    userId: z.string(),
    createdAt: z.string().datetime(),
  })
  .openapi('Digest')
 
export const CreateDigestBody = z
  .object({
    title: z.string(),
    summary: z.string().optional(),
    toc: z.array(TocEntryInput).optional(),
  })
  .openapi('CreateDigestBody')
 
export const DigestSelectionBody = z
  .object({
    digestId: z.string(),
    selectedSubjectIds: z.array(z.string()),
  })
  .openapi('DigestSelectionBody')
