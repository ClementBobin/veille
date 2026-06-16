import { createHash, randomBytes } from 'crypto'

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateKey(): string {
  return 'vk_' + randomBytes(32).toString('hex')
}