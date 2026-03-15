import Anthropic from '@anthropic-ai/sdk'
import { StudyContext, Exam, Topic } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

// ---- Study Plan Generator ----

export interface GeneratedPlan {
  dailySchedule: DaySchedule[]
  milestones: PlanMilestone[]
  insights: string[]
  estimatedCompletion: string
  weeklyHours: number
  recommendedOrder: string[]
}

export interface DaySchedule {
  date: string
  tasks: Array<{
    topicId: string
    topicTitle: string
    durationMins: number
    taskType: 'study' | 'revision' | 'practice'
    notes?: string
  }>
  totalMins: number
}

export interface PlanMilestone {
  date: string
  title: string
  description: string
  topicsCompleted: string[]
}

export async function generateStudyPlan(
  exam: Exam,
  topics: Topic[],
  availableDailyHours: number = 4
): Promise<GeneratedPlan> {
  const examDate = exam.examDate ? new Date(exam.examDate) : null
  const today = new Date()
  const daysUntilExam = examDate
    ? Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 90

  const topicsSummary = topics.map(t => ({
    id: t.id,
    title: t.title,
    difficulty: t.difficulty,
    priority: t.priority,
    estimatedDays: t.estimatedDays,
    masteryLevel: t.masteryLevel,
    status: t.status,
  }))

  const prompt = `You are an expert study plan generator for StratForge, an AI-powered exam preparation platform.

Generate a detailed study plan for the following exam:

EXAM: ${exam.title}
TYPE: ${exam.type}
DAYS UNTIL EXAM: ${daysUntilExam}
AVAILABLE DAILY HOURS: ${availableDailyHours}

TOPICS (with current mastery levels 0-1):
${JSON.stringify(topicsSummary, null, 2)}

Generate a REALISTIC, OPTIMIZED study plan. Return ONLY valid JSON matching this exact structure:
{
  "dailySchedule": [
    {
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "topicId": "topic_id_here",
          "topicTitle": "Topic Name",
          "durationMins": 60,
          "taskType": "study",
          "notes": "Focus on key formulas"
        }
      ],
      "totalMins": 120
    }
  ],
  "milestones": [
    {
      "date": "YYYY-MM-DD",
      "title": "Phase 1 Complete",
      "description": "All high-priority topics studied",
      "topicsCompleted": ["topic_title_1", "topic_title_2"]
    }
  ],
  "insights": [
    "Start with high-priority low-mastery topics first",
    "Schedule revision cycles every 7 days"
  ],
  "estimatedCompletion": "YYYY-MM-DD",
  "weeklyHours": 28,
  "recommendedOrder": ["topic_title_1", "topic_title_2"]
}

Rules:
- Prioritize topics with HIGH priority + LOW mastery first
- Topics with mastery > 0.8 only need revision (30 min sessions)
- Schedule revision cycles every 7 days for completed topics
- Include practice sessions before the exam date
- Keep daily total ≤ ${availableDailyHours * 60} minutes
- Generate schedule for next ${Math.min(daysUntilExam, 30)} days only
- Return ONLY JSON, no markdown, no explanation`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(cleaned) as GeneratedPlan
  } catch {
    console.error('Failed to parse plan JSON:', cleaned.substring(0, 500))
    // Return a basic fallback plan
    return generateFallbackPlan(exam, topics, daysUntilExam, availableDailyHours)
  }
}

function generateFallbackPlan(
  exam: Exam,
  topics: Topic[],
  daysUntilExam: number,
  dailyHours: number
): GeneratedPlan {
  const today = new Date()
  const sorted = [...topics].sort((a, b) => b.priority - a.priority)
  const schedule: DaySchedule[] = []

  for (let i = 0; i < Math.min(daysUntilExam, 30); i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const topicIndex = i % sorted.length
    const topic = sorted[topicIndex]
    schedule.push({
      date: date.toISOString().split('T')[0],
      tasks: [{
        topicId: topic.id,
        topicTitle: topic.title,
        durationMins: dailyHours * 60,
        taskType: topic.masteryLevel > 0.8 ? 'revision' : 'study',
      }],
      totalMins: dailyHours * 60,
    })
  }

  return {
    dailySchedule: schedule,
    milestones: [],
    insights: ['Focus on weak topics first', 'Maintain daily study consistency'],
    estimatedCompletion: new Date(today.getTime() + daysUntilExam * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weeklyHours: dailyHours * 7,
    recommendedOrder: sorted.map((t: any) => t.title),
  }
}

// ---- PDF Syllabus Parser ----

export async function parseSyllabus(text: string): Promise<Array<{
  title: string
  description: string
  estimatedDays: number
  difficulty: number
  priority: number
  tags: string[]
}>> {
  const prompt = `Extract topics from this syllabus text for StratForge study planning.

SYLLABUS TEXT:
${text.substring(0, 8000)}

Return ONLY a JSON array of topics:
[
  {
    "title": "Topic Name",
    "description": "Brief description",
    "estimatedDays": 5,
    "difficulty": 3,
    "priority": 4,
    "tags": ["tag1", "tag2"]
  }
]

Rules:
- difficulty: 1 (very easy) to 5 (very hard)
- priority: 1 (low) to 5 (critical)
- estimatedDays: realistic study days needed (1-30)
- Extract ALL distinct topics, subtopics as separate entries
- Return ONLY valid JSON array`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text2 = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const cleaned = text2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}

// ---- AI Insights Generator ----

export async function generateInsights(
  userId: string,
  exams: Exam[],
  recentLogs: Array<{ topicTitle: string; score: number; minutesSpent: number; logDate: Date }>
): Promise<Array<{
  insightType: string
  title: string
  content: string
  payload: Record<string, unknown>
  priority: number
}>> {
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

  const prompt = `You are the AI study advisor for StratForge. Analyze this student's progress and generate actionable insights.

EXAM PREPARATION STATUS:
${JSON.stringify(examSummary, null, 2)}

RECENT STUDY ACTIVITY (last 7 days):
${JSON.stringify(recentLogs.slice(0, 20), null, 2)}

Generate 3-5 specific, actionable insights. Return ONLY JSON array:
[
  {
    "insightType": "weak_topic|schedule_suggestion|prediction|motivation",
    "title": "Short title",
    "content": "Detailed actionable insight (2-3 sentences)",
    "payload": {},
    "priority": 1
  }
]

Priority: 1=urgent, 2=important, 3=informational
Be specific with numbers and dates. Return ONLY valid JSON.`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}

// ---- Build Study Context for Chat ----

export function buildStudyContext(
  exams: Exam[],
  streak: number,
  totalMinutesToday: number
): StudyContext {
  return {
    exams: exams.map((e: any) => ({
      title: e.title,
      examDate: e.examDate?.toISOString(),
      completionPct: e.completionPct,
      weakTopics: e.topics
        ?.filter((t: any) => t.masteryLevel < 0.4 && t.priority >= 4)
        .map(t => t.title) || [],
      upcomingTopics: e.topics
        ?.filter((t: any) => t.status === 'not_started')
        .slice(0, 3)
        .map(t => t.title) || [],
    })),
    streak,
    recentActivity: `${Math.round(totalMinutesToday / 60)} hours studied today`,
    totalStudyTime: `${Math.round(totalMinutesToday)} minutes today`,
  }
}

export { anthropic }
