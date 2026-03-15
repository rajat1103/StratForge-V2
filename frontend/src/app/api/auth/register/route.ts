import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { signToken, createSessionCookie } from '@/lib/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = registerSchema.parse(body)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { email, name, passwordHash } })
    await prisma.streak.create({ data: { userId: user.id } })

    const token = await signToken({ userId: user.id, email: user.email, name: user.name ?? undefined })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, message: 'Account created successfully' })
    response.cookies.set(createSessionCookie(token))
    return response
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
