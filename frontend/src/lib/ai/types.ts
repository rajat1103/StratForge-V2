/**
 * StratForge AI Types
 * Provider-independent types for AI operations that are NOT already in @/types.
 */

// Re-export shared types from the central type registry
export type { StudyContext } from '@/types'

/** A single chat message exchanged with the AI assistant */
export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** One day in a generated study plan */
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

/** A milestone in a generated study plan */
export interface PlanMilestone {
  date: string
  title: string
  description: string
  topicsCompleted: string[]
}

/** Complete generated study plan returned by AI */
export interface GeneratedPlan {
  dailySchedule: DaySchedule[]
  milestones: PlanMilestone[]
  insights: string[]
  estimatedCompletion: string
  weeklyHours: number
  recommendedOrder: string[]
}

/** One AI-generated insight about the student's study progress */
export interface GeneratedInsight {
  insightType: 'weak_topic' | 'schedule_suggestion' | 'prediction' | 'motivation'
  title: string
  content: string
  payload: Record<string, unknown>
  priority: number
}

/** AI error codes for sanitized classification */
export type AIErrorCode =
  | 'AI_AUTHENTICATION_FAILED'
  | 'AI_RATE_LIMITED'
  | 'AI_INSUFFICIENT_CREDITS'
  | 'AI_INVALID_REQUEST'
  | 'AI_INVALID_MODEL'
  | 'AI_NETWORK_ERROR'
  | 'AI_TIMEOUT'
  | 'AI_SERVER_ERROR'
  | 'AI_RESPONSE_ERROR'
  | 'AI_UNKNOWN_ERROR'

/** Classified AI error with user-safe message */
export interface AIError {
  code: AIErrorCode
  userMessage: string
  httpStatus: number
}

/** Topic data shape passed to AI prompts */
export interface TopicSummary {
  id: string
  title: string
  difficulty: number
  priority: number
  estimatedDays: number
  masteryLevel: number
  status: string
}
