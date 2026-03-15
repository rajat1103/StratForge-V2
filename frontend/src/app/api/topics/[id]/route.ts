import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  priority: z.number().min(1).max(5).optional(),
  estimatedDays: z.number().min(1).max(365).optional(),
  masteryLevel: z.number().min(0).max(1).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'needs_revision']).optional(),
  order: z.number().optional(),
  tags: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    // Verify ownership
    const topic = await prisma.topic.findFirst({
      where: { id: params.id, exam: { userId: session.userId } },
      include: { exam: true },
    })
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    const updated = await prisma.topic.update({
      where: { id: params.id },
      data,
      include: { checklistItems: true },
    })

    // Recalculate exam completion
    await recalcExamCompletion(topic.examId)

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

  const topic = await prisma.topic.findFirst({
    where: { id: params.id, exam: { userId: session.userId } },
  })
  if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

  await prisma.topic.delete({ where: { id: params.id } })
  await recalcExamCompletion(topic.examId)

  return NextResponse.json({ message: 'Topic deleted' })
}

async function recalcExamCompletion(examId: string) {
  const topics = await prisma.topic.findMany({
    where: { examId },
    select: { status: true },
  })
  const completionPct = topics.length > 0
    ? Math.round((topics.filter((t: any) => t.status === 'completed').length / topics.length) * 100)
    : 0
  await prisma.exam.update({
    where: { id: examId },
    data: { completionPct, totalTopics: topics.length },
  })
}
