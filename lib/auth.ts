import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateKey(): string {
  return 'vk_' + randomBytes(32).toString('hex')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}