import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exam = await prisma.exam.findFirst({
    where: { id: params.id, userId: session.userId },
    include: {
      topics: {
        include: {
          checklistItems: { orderBy: { order: 'asc' } },
          progressLogs: {
            orderBy: { logDate: 'desc' },
            take: 5,
          },
        },
        orderBy: { order: 'asc' },
      },
      studyPlans: {
        where: { isActive: true },
        include: {
          tasks: {
            where: {
              scheduledDate: {
                gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                lte: new Date(new Date().setDate(new Date().getDate() + 30)),
              },
            },
            include: { topic: true },
            orderBy: { scheduledDate: 'asc' },
          },
        },
        take: 1,
      },
    },
  })

  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

  return NextResponse.json({ data: exam })
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['competitive', 'university', 'certification', 'skill']).optional(),
  examDate: z.string().optional().nullable(),
  description: z.string().optional(),
  theme: z.string().optional(),
  colorAccent: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const exam = await prisma.exam.updateMany({
      where: { id: params.id, userId: session.userId },
      data: {
        ...data,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
      },
    })

    if (exam.count === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    const updated = await prisma.exam.findUnique({ where: { id: params.id } })
    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deleted = await prisma.exam.deleteMany({
    where: { id: params.id, userId: session.userId },
  })

  if (deleted.count === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  return NextResponse.json({ message: 'Exam deleted' })
}
