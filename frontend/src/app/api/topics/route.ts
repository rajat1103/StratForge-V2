import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

const topicSchema = z.object({
  examId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(3),
  priority: z.number().min(1).max(5).default(3),
  estimatedDays: z.number().min(1).max(365).default(3),
  order: z.number().optional(),
  tags: z.array(z.string()).default([]),
  checklistItems: z.array(z.object({
    label: z.string(),
    order: z.number().optional(),
  })).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const examId = searchParams.get('examId')

  const where = examId
    ? { examId, exam: { userId: session.userId } }
    : { exam: { userId: session.userId } }

  const topics = await prisma.topic.findMany({
    where,
    include: {
      checklistItems: { orderBy: { order: 'asc' } },
      _count: { select: { progressLogs: true } },
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ data: topics })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = topicSchema.parse(body)

    // Verify exam belongs to user
    const exam = await prisma.exam.findFirst({
      where: { id: data.examId, userId: session.userId },
    })
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    const maxOrder = await prisma.topic.aggregate({
      where: { examId: data.examId },
      _max: { order: true },
    })

    const topic = await prisma.topic.create({
      data: {
        examId: data.examId,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        priority: data.priority,
        estimatedDays: data.estimatedDays,
        order: data.order ?? (maxOrder._max.order || 0) + 1,
        tags: data.tags,
        checklistItems: data.checklistItems ? {
          create: data.checklistItems.map((item, idx) => ({
            label: item.label,
            order: item.order ?? idx,
          })),
        } : undefined,
      },
      include: { checklistItems: true },
    })

    // Update exam topic count
    await prisma.exam.update({
      where: { id: data.examId },
      data: { totalTopics: { increment: 1 } },
    })

    return NextResponse.json({ data: topic }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
