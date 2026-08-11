import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

const createSessionSchema = z.object({
  topicId: z.string().optional().nullable(),
  durationMins: z.number().min(1),
  mode: z.enum(['normal', 'pomodoro', 'deep_work', 'revision']).default('pomodoro'),
  focusScore: z.number().min(1).max(10).optional().default(8),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSessionSchema.parse(body)

    if (data.topicId) {
      const topic = await prisma.topic.findFirst({
        where: { id: data.topicId, exam: { userId: session.userId } },
      })
      if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const endedAt = new Date()
    const startedAt = new Date(endedAt.getTime() - data.durationMins * 60000)

    const studySession = await prisma.studySession.create({
      data: {
        userId: session.userId,
        topicId: data.topicId,
        startedAt,
        endedAt,
        durationMins: data.durationMins,
        focusScore: data.focusScore,
        mode: data.mode,
        notes: data.notes,
      },
    })

    return NextResponse.json({ data: studySession }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to record session' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await prisma.studySession.findMany({
    where: { userId: session.userId },
    include: { topic: { select: { title: true, exam: { select: { title: true } } } } },
    orderBy: { startedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ data: sessions })
}
