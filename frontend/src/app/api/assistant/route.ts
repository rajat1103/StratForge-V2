import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createAssistantStream, buildStudyContext, classifyAIError } from '@/lib/ai/client'
import prisma from '@/lib/db/prisma'
import type { Exam } from '@/types'
import type { AIChatMessage } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as { messages?: AIChatMessage[] }
    const messages = body.messages

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Build student context — scoped strictly to session.userId
    const [exams, streak, todayLogs] = await Promise.all([
      prisma.exam.findMany({
        where: { userId: session.userId, status: 'active' },
        include: {
          topics: {
            select: { title: true, masteryLevel: true, priority: true, status: true },
          },
        },
      }),
      prisma.streak.findUnique({ where: { userId: session.userId } }),
      prisma.progressLog.findMany({
        where: {
          userId: session.userId,
          logDate: { gte: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })() },
        },
      }),
    ])

    const totalMinutesToday = todayLogs.reduce((s, l) => s + l.minutesSpent, 0)
    const context = buildStudyContext(exams as unknown as Exam[], streak?.currentStreak ?? 0, totalMinutesToday)

    // Get streaming ReadableStream from the AI service
    const stream = createAssistantStream(messages, context)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: unknown) {
    const { code, userMessage, httpStatus } = classifyAIError(error)
    const e = error as Record<string, unknown>
    console.error(`[AI_ASSISTANT] ${code}: status=${e?.status} msg=${String(e?.message ?? '').substring(0, 200)}`)
    return NextResponse.json({ error: userMessage, code }, { status: httpStatus })
  }
}
