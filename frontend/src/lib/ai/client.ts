/**
 * StratForge AI Service
 *
 * Provider: Groq
 * Model: llama-3.3-70b-versatile
 *   - 70B parameters, 131K context window
 *   - Best free-tier Groq model for conversational tutoring,
 *     structured output (JSON), and educational reasoning
 *   - Overrideable via GROQ_MODEL env var
 *
 * Application code should import from this file ONLY.
 * No other file should import from groq-sdk directly.
 */

import Groq from 'groq-sdk'
import type {
  AIChatMessage,
  GeneratedPlan,
  GeneratedInsight,
  AIError,
  AIErrorCode,
  StudyContext,
  TopicSummary,
} from './types'
import {
  buildAssistantSystemPrompt,
  buildStudyPlanPrompt,
  buildInsightsPrompt,
  buildSyllabusParserPrompt,
} from './prompts'
import type { Exam, Topic } from '@/types'

// ─── Provider client (server-side only) ──────────────────────────────────────

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

/** Active model — configurable via GROQ_MODEL env var */
export const AI_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

// ─── Error Classification ────────────────────────────────────────────────────

/**
 * Classifies a raw Groq/network error into a sanitized AIError.
 * Never leaks credentials, raw stack traces, or provider internals.
 */
export function classifyAIError(error: unknown): AIError {
  const err = error as Record<string, unknown>
  const status = typeof err?.status === 'number' ? err.status : 0
  const msg: string = typeof err?.message === 'string' ? err.message.toLowerCase() : ''
  const errorType: string = typeof err?.error === 'object' && err.error !== null
    ? String((err.error as Record<string, unknown>).type ?? '')
    : ''

  const make = (code: AIErrorCode, userMessage: string, httpStatus: number): AIError =>
    ({ code, userMessage, httpStatus })

  if (status === 401 || msg.includes('invalid api key') || msg.includes('authentication') || msg.includes('api_key')) {
    return make('AI_AUTHENTICATION_FAILED', 'AI service authentication failed. Please contact support.', 503)
  }
  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests') || errorType.includes('rate_limit')) {
    return make('AI_RATE_LIMITED', 'AI service is busy. Please wait a moment and try again.', 429)
  }
  if (msg.includes('credit') || msg.includes('billing') || msg.includes('quota') || msg.includes('insufficient')) {
    return make('AI_INSUFFICIENT_CREDITS', 'AI service account limit reached. Please try again later.', 503)
  }
  if (status === 404 || msg.includes('model') && msg.includes('not found')) {
    return make('AI_INVALID_MODEL', 'AI model is unavailable. Please try again later.', 503)
  }
  if (status === 400 || msg.includes('invalid_request') || errorType.includes('invalid_request')) {
    return make('AI_INVALID_REQUEST', 'AI request was invalid. Please try rephrasing.', 400)
  }
  if (msg.includes('timeout') || msg.includes('timed out') || status === 408) {
    return make('AI_TIMEOUT', 'AI service timed out. Please try again.', 504)
  }
  if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('fetch failed')) {
    return make('AI_NETWORK_ERROR', 'Cannot reach AI service. Check your connection.', 503)
  }
  if (status >= 500 || msg.includes('server error') || msg.includes('overloaded')) {
    return make('AI_SERVER_ERROR', 'AI service is temporarily overloaded. Please try again shortly.', 503)
  }
  return make('AI_UNKNOWN_ERROR', 'AI assistant is temporarily unavailable. Please try again.', 500)
}

// ─── Streaming (AI Assistant) ────────────────────────────────────────────────

export function createAssistantStream(
  messages: AIChatMessage[],
  context: StudyContext
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const systemPrompt = buildAssistantSystemPrompt(context)

  return new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data))

      try {
        const stream = await groq.chat.completions.create({
          model: AI_MODEL,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        })

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            send(`data: ${JSON.stringify({ text: delta })}\n\n`)
          }
        }

        send('data: [DONE]\n\n')
        controller.close()
      } catch (err: unknown) {
        const { code, userMessage } = classifyAIError(err)
        const e = err as Record<string, unknown>
        console.error(`[AI_ASSISTANT] ${code}: status=${e?.status} msg=${String(e?.message ?? '').substring(0, 200)}`)
        send(`data: ${JSON.stringify({ error: userMessage, code })}\n\n`)
        send('data: [DONE]\n\n')
        controller.close()
      }
    },
  })
}

// ─── Study Context Builder ───────────────────────────────────────────────────

export function buildStudyContext(
  exams: Exam[],
  streak: number,
  totalMinutesToday: number
): StudyContext {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return {
    exams: exams.map((e: any) => {
      const examDate = e.examDate ? new Date(e.examDate) : null
      const isPast = examDate ? examDate.getTime() < today.getTime() : false

      return {
        title: e.title,
        examDate: e.examDate?.toISOString(),
        isPast,
        completionPct: e.completionPct,
        weakTopics: e.topics
          ?.filter((t: any) => t.masteryLevel < 0.4 && t.priority >= 4)
          .map((t: any) => t.title) || [],
        upcomingTopics: e.topics
          ?.filter((t: any) => t.status === 'not_started')
          .slice(0, 3)
          .map((t: any) => t.title) || [],
      }
    }),
    streak,
    recentActivity: `${Math.round(totalMinutesToday / 60)} hours studied today`,
    totalStudyTime: `${Math.round(totalMinutesToday)} minutes today`,
  }
}

// ─── Study Plan Generation ───────────────────────────────────────────────────

export async function generateStudyPlan(
  exam: Exam,
  topics: Topic[],
  availableDailyHours = 4
): Promise<GeneratedPlan> {
  const examDate = exam.examDate ? new Date(exam.examDate) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Clean days until exam calculation
  const daysUntilExam = examDate && examDate.getTime() > today.getTime()
    ? Math.max(7, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 60

  const todayStr = today.toISOString().split('T')[0]

  const topicsSummary: TopicSummary[] = topics.map(t => ({
    id: t.id,
    title: t.title,
    difficulty: t.difficulty,
    priority: t.priority,
    estimatedDays: t.estimatedDays,
    masteryLevel: t.masteryLevel,
    status: t.status,
  }))

  const prompt = buildStudyPlanPrompt(exam.title, exam.type, daysUntilExam, availableDailyHours, topicsSummary, todayStr)

  let plan: GeneratedPlan

  try {
    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      stream: false,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as GeneratedPlan
    if (!Array.isArray(parsed.dailySchedule) || parsed.dailySchedule.length === 0) {
      throw new Error('Invalid plan structure')
    }
    plan = parsed
  } catch (parseErr) {
    console.warn('[AI_PLANS] Using fallback plan generator:', (parseErr as Error).message)
    plan = generateFallbackPlan(exam, topics, daysUntilExam, availableDailyHours)
  }

  // Normalize daily schedule dates to ensure they start sequentially from today
  plan.dailySchedule = plan.dailySchedule.map((day, idx) => {
    const d = new Date(today)
    d.setDate(today.getDate() + idx)
    return {
      ...day,
      date: d.toISOString().split('T')[0],
    }
  })

  return plan
}

function generateFallbackPlan(
  exam: Exam,
  topics: Topic[],
  daysUntilExam: number,
  dailyHours: number
): GeneratedPlan {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sorted = [...topics].sort((a, b) => b.priority - a.priority)

  const dailySchedule = Array.from({ length: Math.min(daysUntilExam, 30) }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const topic = sorted[i % sorted.length]
    return {
      date: date.toISOString().split('T')[0],
      tasks: [{
        topicId: topic.id,
        topicTitle: topic.title,
        durationMins: dailyHours * 60,
        taskType: (topic.masteryLevel > 0.8 ? 'revision' : 'study') as 'revision' | 'study',
      }],
      totalMins: dailyHours * 60,
    }
  })

  return {
    dailySchedule,
    milestones: [],
    insights: ['Focus on weak topics first', 'Maintain daily study consistency'],
    estimatedCompletion: new Date(today.getTime() + daysUntilExam * 86400000).toISOString().split('T')[0],
    weeklyHours: dailyHours * 7,
    recommendedOrder: sorted.map(t => t.title),
  }
}

// ─── Insights Generation ─────────────────────────────────────────────────────

export async function generateInsights(
  _userId: string,
  exams: Exam[],
  recentLogs: Array<{ topicTitle: string; score: number; minutesSpent: number; logDate: Date }>
): Promise<GeneratedInsight[]> {
  const examSummary = exams.map((e: any) => ({
    title: e.title,
    completionPct: e.completionPct,
    daysLeft: e.examDate
      ? Math.ceil((new Date(e.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
    topics: e.topics?.map((t: any) => ({
      title: t.title,
      mastery: t.masteryLevel,
      priority: t.priority,
      status: t.status,
    })),
  }))

  const prompt = buildInsightsPrompt(examSummary, recentLogs)

  const response = await groq.chat.completions.create({
    model: AI_MODEL,
    max_tokens: 1024,
    temperature: 0.5,
    stream: false,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0]?.message?.content ?? '[]'
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned) as GeneratedInsight[]
    if (!Array.isArray(parsed)) throw new Error('Not an array')
    return parsed
  } catch {
    console.error('[AI_INSIGHTS] JSON parse failed:', cleaned.substring(0, 300))
    return []
  }
}

// ─── Syllabus Parser ─────────────────────────────────────────────────────────

export async function parseSyllabus(text: string): Promise<Array<{
  title: string
  description: string
  estimatedDays: number
  difficulty: number
  priority: number
  tags: string[]
}>> {
  const prompt = buildSyllabusParserPrompt(text)

  const response = await groq.chat.completions.create({
    model: AI_MODEL,
    max_tokens: 2048,
    temperature: 0.3,
    stream: false,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0]?.message?.content ?? '[]'
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}
