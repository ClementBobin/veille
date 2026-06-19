import { prisma } from './prisma'

export async function getUserConfig(userId: string) {
  const configs = await prisma.config.findMany({ where: { userId } })
  const map = Object.fromEntries(configs.map(c => [c.key, c.value]))

  return {
    n8nBaseUrl: map['N8N_BASE_URL'] ?? process.env.N8N_BASE_URL ?? 'http://localhost:5678',
    n8nWebhookPath: map['N8N_WEBHOOK_PATH'] ?? process.env.N8N_WEBHOOK_PATH ?? 'webhook-test',
    retentionDays: parseInt(map['RETENTION_DAYS'] ?? process.env.RETENTION_DAYS ?? '7', 10),
  }
}