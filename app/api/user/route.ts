import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth } from '@/lib/auth-context'
import { verifyPassword } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { password, confirm } = await req.json()
  if (confirm !== 'DELETE MY ACCOUNT') {
    return NextResponse.json({ error: 'Confirmation incorrecte' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  await prisma.user.delete({ where: { id: userId } })

  const res = NextResponse.json({ ok: true })
  res.cookies.delete('session')
  return res
}