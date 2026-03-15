import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, getSessionFromRequest } from '@/lib/auth'
import prisma from '@/lib/db/prisma'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete(SESSION_COOKIE)
  return response
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ user: null })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, email: true, name: true, avatarUrl: true,
      theme: true, preferences: true, createdAt: true, updatedAt: true,
      streak: true,
    },
  })

  return NextResponse.json({ user })
}
