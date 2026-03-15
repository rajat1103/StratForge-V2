import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { generateStudyPlan } from '@/lib/ai/client'
import type { Exam, Topic } from '@/types'

const generateSchema = z.object({
  examId: z.string(),
  dailyHours: z.number().min(0.5).max(16).default(4),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { examId, dailyHours } = generateSchema.parse(body)

    const exam = await prisma.exam.findFirst({
      where: { id: examId, userId: session.userId },
      include: { topics: true },
    })
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    if (exam.topics.length === 0) {
      return NextResponse.json({ error: 'Add topics before generating a plan' }, { status: 400 })
    }

    await prisma.studyPlan.updateMany({ where: { examId, isActive: true }, data: { isActive: false } })

    const generatedPlan = await generateStudyPlan(
      exam as unknown as Exam,
      exam.topics as unknown as Topic[],
      dailyHours
    )

    const plan = await prisma.studyPlan.create({
      data: {
        examId,
        schedule: generatedPlan as unknown as Prisma.InputJsonValue,
        validUntil: exam.examDate,
        isActive: true,
      },
    })

    const topicMap = new Map(exam.topics.map((t: typeof exam.topics[0]) => [t.id, t]))
    const taskData: Array<{
      planId: string
      topicId: string
      scheduledDate: Date
      durationMins: number
      taskType: string
    }> = []

    for (const day of generatedPlan.dailySchedule) {
      for (const task of day.tasks) {
        if (topicMap.has(task.topicId)) {
          taskData.push({
            planId: plan.id,
            topicId: task.topicId,
            scheduledDate: new Date(day.date),
            durationMins: task.durationMins,
            taskType: task.taskType,
          })
        }
      }
    }
    if (taskData.length > 0) await prisma.planTask.createMany({ data: taskData })

    const fullPlan = await prisma.studyPlan.findUnique({
      where: { id: plan.id },
      include: {
        tasks: { include: { topic: true }, orderBy: { scheduledDate: 'asc' } },
      },
    })
    return NextResponse.json({ data: fullPlan }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Plan generation error:', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const examId = searchParams.get('examId')

  const plans = await prisma.studyPlan.findMany({
    where: {
      exam: { userId: session.userId },
      ...(examId ? { examId } : {}),
      isActive: true,
    },
    include: {
      tasks: {
        where: {
          scheduledDate: {
            gte: new Date(Date.now() - 86400000),
            lte: new Date(Date.now() + 30 * 86400000),
          },
        },
        include: { topic: true },
        orderBy: { scheduledDate: 'asc' },
      },
      exam: { select: { title: true, colorAccent: true, examDate: true } },
    },
    orderBy: { generatedAt: 'desc' },
  })
  return NextResponse.json({ data: plans })
}
