import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { createSessionToken } from '@/lib/session'

export async function POST(req: NextRequest) {
  let email: string, password: string
  try {
    const body = await req.json()
    email = body.email
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Email ou mot de passe invalide' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, email: user.email })
  res.cookies.set('session', await createSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('session')
  return res
}