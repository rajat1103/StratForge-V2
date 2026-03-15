import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { signToken, createSessionCookie } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)
    const user = await prisma.user.findUnique({ where: { email }, include: { streak: true } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const token = await signToken({ userId: user.id, email: user.email, name: user.name ?? undefined })
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, theme: user.theme, streak: user.streak },
    })
    response.cookies.set(createSessionCookie(token))
    return response
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
