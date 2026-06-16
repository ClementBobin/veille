import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateKey, hashKey } from '@/lib/auth'

const ADMIN = process.env.ADMIN_SECRET

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === ADMIN
}

// Lister les clés (sans révéler le hash)
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const keys = await prisma.apiKey.findMany({
    select: { id: true, name: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(keys)
}

// Créer une clé
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const raw = generateKey()
  await prisma.apiKey.create({ data: { name, keyHash: hashKey(raw) } })

  // On retourne la clé en clair UNE seule fois
  return NextResponse.json({ key: raw, name }, { status: 201 })
}

// Supprimer une clé
export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}