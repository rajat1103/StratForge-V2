import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type TopicSummary = { masteryLevel: number; status: string; priority: number; title: string; difficulty: number; id: string }
type ExamWithTopics = { id: string; title: string; examDate: Date | null; topics: TopicSummary[] }

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [exams, streak, insights] = await Promise.all([
    prisma.exam.findMany({
      where: { userId: session.userId, status: 'active' },
      include: {
        topics: {
          select: { masteryLevel: true, status: true, priority: true, title: true, difficulty: true, id: true, updatedAt: true },
        },
      },
    }),
    prisma.streak.findUnique({ where: { userId: session.userId } }),
    prisma.aIInsight.findMany({
      where: { userId: session.userId, read: false },
      orderBy: [{ priority: 'asc' }, { generatedAt: 'desc' }],
      take: 5,
    }),
  ])

  const weekLogs = await prisma.progressLog.findMany({
    where: { userId: session.userId, logDate: { gte: new Date(Date.now() - 7 * 86400000) } },
    orderBy: { logDate: 'asc' },
  })

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    const dayLogs = weekLogs.filter((l: typeof weekLogs[0]) => {
      const ld = new Date(l.logDate); ld.setHours(0, 0, 0, 0)
      return ld.getTime() === d.getTime()
    })
    return { day: days[d.getDay()], minutes: dayLogs.reduce((s, l) => s + l.minutesSpent, 0), target: 120 }
  })

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayMinutes = weekLogs.filter((l: typeof weekLogs[0]) => new Date(l.logDate) >= today).reduce((s, l) => s + l.minutesSpent, 0)

  const avgCompletion = exams.length > 0
    ? Math.round(exams.reduce((s: number, e: ExamWithTopics) => {
        const done = e.topics.filter((t: TopicSummary) => t.status === 'completed').length
        return s + (e.topics.length ? (done / e.topics.length) * 100 : 0)
      }, 0) / exams.length)
    : 0

  const upcomingDeadlines = (exams as ExamWithTopics[])
    .filter((e: typeof exams[0]) => e.examDate)
    .map((e: typeof exams[0]) => ({
      examId: e.id, examTitle: e.title, examDate: e.examDate!,
      daysLeft: Math.max(0, Math.ceil((new Date(e.examDate!).getTime() - Date.now()) / 86400000)),
      completionPct: e.topics.length
        ? Math.round(e.topics.filter((t: TopicSummary) => t.status === 'completed').length / e.topics.length * 100) : 0,
      colorAccent: '#00D4FF',
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3)

  const topicHeatmap = (exams as ExamWithTopics[]).flatMap(e =>
    e.topics.map((t: TopicSummary) => ({
      topicId: t.id, topicTitle: t.title, examTitle: e.title,
      masteryLevel: t.masteryLevel, difficulty: t.difficulty, priority: t.priority,
    }))
  )

  return NextResponse.json({
    data: {
      activeExams: exams.length, avgCompletion, todayMinutes,
      currentStreak: streak?.currentStreak || 0, longestStreak: streak?.longestStreak || 0,
      totalStudyDays: streak?.totalStudyDays || 0,
      weeklyProgress, upcomingDeadlines, recentInsights: insights, topicHeatmap,
    },
  })
}
