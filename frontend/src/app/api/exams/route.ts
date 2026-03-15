import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

const createExamSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['competitive', 'university', 'certification', 'skill']).default('competitive'),
  examDate: z.string().optional().nullable(),
  description: z.string().optional(),
  theme: z.enum(['engineering', 'medical', 'finance', 'programming', 'minimal', 'default']).default('default'),
  colorAccent: z.string().default('#00D4FF'),
})

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exams = await prisma.exam.findMany({
    where: { userId: session.userId },
    include: {
      _count: { select: { topics: true } },
      topics: { select: { id: true, masteryLevel: true, status: true, priority: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const examsWithStats = exams.map(exam => {
    const completed = exam.topics.filter((t: any) => t.status === 'completed').length
    const completionPct = exam.topics.length > 0
      ? Math.round((completed / exam.topics.length) * 100) : 0
    return { ...exam, completionPct }
  })

  return NextResponse.json({ data: examsWithStats })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createExamSchema.parse(body)
    const exam = await prisma.exam.create({
      data: {
        userId: session.userId,
        title: data.title, type: data.type,
        examDate: data.examDate ? new Date(data.examDate) : null,
        description: data.description, theme: data.theme, colorAccent: data.colorAccent,
      },
    })
    return NextResponse.json({ data: exam }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}
