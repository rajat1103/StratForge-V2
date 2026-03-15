import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

const logSchema = z.object({
  topicId: z.string(),
  score: z.number().min(0).max(100),
  minutesSpent: z.number().min(1),
  notes: z.string().optional(),
  sessionType: z.enum(['study', 'revision', 'practice']).default('study'),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = logSchema.parse(body)

    const topic = await prisma.topic.findFirst({ where: { id: data.topicId, exam: { userId: session.userId } } })
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    const log = await prisma.progressLog.create({ data: { ...data, userId: session.userId } })

    const recentLogs = await prisma.progressLog.findMany({ where: { topicId: data.topicId }, orderBy: { logDate: 'desc' }, take: 5 })
    const avgScore = recentLogs.reduce((s, l) => s + l.score, 0) / recentLogs.length
    const newMastery = Math.min(1, avgScore / 100)
    const newStatus = newMastery >= 0.85 ? 'completed' : newMastery >= 0.3 ? 'in_progress' : topic.status

    await prisma.topic.update({ where: { id: data.topicId }, data: { masteryLevel: newMastery, status: newStatus } })

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const streak = await prisma.streak.findUnique({ where: { userId: session.userId } })
    if (streak) {
      const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null
      lastActive?.setHours(0, 0, 0, 0)
      const isNewDay = !lastActive || lastActive.getTime() < today.getTime()
      if (isNewDay) {
        const isConsecutive = lastActive && today.getTime() - lastActive.getTime() <= 86400000 * 1.5
        await prisma.streak.update({
          where: { userId: session.userId },
          data: {
            currentStreak: isConsecutive ? { increment: 1 } : 1,
            longestStreak: isConsecutive ? { set: Math.max(streak.longestStreak, streak.currentStreak + 1) } : streak.longestStreak,
            lastActiveDate: new Date(),
            totalStudyDays: { increment: 1 },
          },
        })
      }
    }
    return NextResponse.json({ data: log }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to log progress' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const topicId = searchParams.get('topicId')
  const days = parseInt(searchParams.get('days') || '30')
  const since = new Date(); since.setDate(since.getDate() - days)

  const logs = await prisma.progressLog.findMany({
    where: { userId: session.userId, ...(topicId ? { topicId } : {}), logDate: { gte: since } },
    include: { topic: { select: { title: true, examId: true } } },
    orderBy: { logDate: 'desc' },
  })
  return NextResponse.json({ data: logs })
}
