import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { generateInsights } from '@/lib/ai/client'
import type { Exam } from '@/types'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const insights = await prisma.aIInsight.findMany({
    where: { userId: session.userId },
    orderBy: [{ priority: 'asc' }, { generatedAt: 'desc' }],
    take: 20,
  })
  const unread = insights.filter((i: typeof insights[0]) => !i.read).length
  return NextResponse.json({ data: insights, unread })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const exams = await prisma.exam.findMany({
      where: { userId: session.userId, status: 'active' },
      include: { topics: { select: { id: true, title: true, masteryLevel: true, priority: true, status: true } } },
    })

    const since = new Date()
    since.setDate(since.getDate() - 7)
    const recentLogs = await prisma.progressLog.findMany({
      where: { userId: session.userId, logDate: { gte: since } },
      include: { topic: { select: { title: true } } },
      orderBy: { logDate: 'desc' },
      take: 30,
    })

    const logsForAI = recentLogs.map((l: typeof recentLogs[0]) => ({
      topicTitle: l.topic.title,
      score: l.score,
      minutesSpent: l.minutesSpent,
      logDate: l.logDate,
    }))

    const insights = await generateInsights(session.userId, exams as unknown as Exam[], logsForAI)
    if (insights.length > 0) {
      await prisma.aIInsight.createMany({
        data: insights.map((i: typeof insights[0]) => ({
          userId: session.userId,
          insightType: i.insightType,
          title: i.title,
          content: i.content,
          payload: i.payload as unknown as Prisma.InputJsonValue,
          priority: i.priority,
        })),
      })
    }

    const all = await prisma.aIInsight.findMany({
      where: { userId: session.userId },
      orderBy: [{ priority: 'asc' }, { generatedAt: 'desc' }],
      take: 20,
    })
    return NextResponse.json({ data: all, generated: insights.length })
  } catch (error: unknown) {
    console.error('Insight generation error:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (id) {
    await prisma.aIInsight.updateMany({ where: { id, userId: session.userId }, data: { read: true } })
  } else {
    await prisma.aIInsight.updateMany({ where: { userId: session.userId }, data: { read: true } })
  }
  return NextResponse.json({ message: 'Marked as read' })
}
