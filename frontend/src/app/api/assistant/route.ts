import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { anthropic, CLAUDE_MODEL, buildStudyContext } from '@/lib/ai/client'
import prisma from '@/lib/db/prisma'
import type { Exam, Topic } from '@/types'

interface ChatMsg { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { messages } = await req.json() as { messages: ChatMsg[] }

    const exams = await prisma.exam.findMany({
      where: { userId: session.userId, status: 'active' },
      include: { topics: { select: { title: true, masteryLevel: true, priority: true, status: true } } },
    })

    const streak = await prisma.streak.findUnique({ where: { userId: session.userId } })
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayLogs = await prisma.progressLog.findMany({ where: { userId: session.userId, logDate: { gte: today } } })
    const totalMinutesToday = todayLogs.reduce((s, l) => s + l.minutesSpent, 0)

    const context = buildStudyContext(exams as unknown as Exam[], streak?.currentStreak || 0, totalMinutesToday)

    const systemPrompt = `You are StratForge AI — a highly intelligent, encouraging, and precise study assistant.

STUDENT CONTEXT:
${JSON.stringify(context, null, 2)}

Your role:
- Analyze the student's preparation status and give specific, actionable advice
- Reference their actual exam data, topics, and progress when relevant
- Be motivating but honest — don't sugarcoat genuine weak areas
- Suggest concrete study strategies, schedules, and topic prioritization
- Keep responses focused and practical
- Use markdown for structure when helpful (headers, bullet points, code blocks for formulas)
- Address them as a knowledgeable mentor who knows their study situation

Never make up data — only reference what's in the context above.`

    const stream = await anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (error: unknown) {
    console.error('Assistant error:', error)
    return NextResponse.json({ error: 'AI assistant unavailable' }, { status: 500 })
  }
}
