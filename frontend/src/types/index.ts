// ============================================================
// StratForge — Core Type Definitions
// ============================================================

export type ExamTheme = 'engineering' | 'medical' | 'finance' | 'programming' | 'minimal' | 'default'
export type ExamType = 'competitive' | 'university' | 'certification' | 'skill'
export type ExamStatus = 'active' | 'completed' | 'paused'
export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_revision'
export type SessionMode = 'normal' | 'pomodoro' | 'deep_work' | 'revision'
export type InsightType = 'weak_topic' | 'schedule_suggestion' | 'weekly_report' | 'motivation' | 'prediction'
export type TaskType = 'study' | 'revision' | 'practice' | 'milestone'

export interface User {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  theme: string
  preferences: Record<string, unknown>
  createdAt: Date
  streak?: Streak
}

export interface Exam {
  id: string
  userId: string
  title: string
  type: ExamType
  examDate?: Date | null
  description?: string | null
  totalTopics: number
  completionPct: number
  status: ExamStatus
  theme: ExamTheme
  colorAccent: string
  createdAt: Date
  updatedAt: Date
  topics?: Topic[]
  studyPlans?: StudyPlan[]
  _count?: { topics: number }
}

export interface Topic {
  id: string
  examId: string
  title: string
  description?: string | null
  difficulty: number
  priority: number
  estimatedDays: number
  masteryLevel: number
  status: TopicStatus
  order: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
  checklistItems?: ChecklistItem[]
  progressLogs?: ProgressLog[]
  exam?: Exam
}

export interface ChecklistItem {
  id: string
  topicId: string
  label: string
  completed: boolean
  completedAt?: Date | null
  order: number
}

export interface ProgressLog {
  id: string
  topicId: string
  userId: string
  score: number
  minutesSpent: number
  logDate: Date
  notes?: string | null
  sessionType: string
}

export interface StudyPlan {
  id: string
  examId: string
  schedule: PlanSchedule
  generatedAt: Date
  validUntil?: Date | null
  version: number
  isActive: boolean
  tasks?: PlanTask[]
}

export interface PlanSchedule {
  startDate: string
  endDate: string
  totalDays: number
  dailyHours: number
  milestones: Milestone[]
  weeklyBreakdown: WeeklyBlock[]
}

export interface Milestone {
  date: string
  title: string
  topicsCompleted: string[]
}

export interface WeeklyBlock {
  weekNumber: number
  topics: string[]
  targetHours: number
  focus: string
}

export interface PlanTask {
  id: string
  planId: string
  topicId: string
  scheduledDate: Date
  durationMins: number
  completed: boolean
  taskType: TaskType
  completedAt?: Date | null
  topic?: Topic
}

export interface StudySession {
  id: string
  userId: string
  topicId?: string | null
  startedAt: Date
  endedAt?: Date | null
  durationMins?: number | null
  focusScore?: number | null
  mode: SessionMode
  notes?: string | null
  topic?: Topic
}

export interface AIInsight {
  id: string
  userId: string
  insightType: InsightType
  title: string
  content: string
  payload: Record<string, unknown>
  read: boolean
  priority: number
  generatedAt: Date
  expiresAt?: Date | null
}

export interface Streak {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastActiveDate?: Date | null
  totalStudyDays: number
}

// Dashboard stats
export interface DashboardStats {
  activeExams: number
  avgCompletion: number
  todayMinutes: number
  currentStreak: number
  weeklyProgress: WeeklyProgress[]
  upcomingDeadlines: DeadlineItem[]
  recentInsights: AIInsight[]
  topicHeatmap: HeatmapEntry[]
}

export interface WeeklyProgress {
  day: string
  minutes: number
  target: number
}

export interface DeadlineItem {
  examId: string
  examTitle: string
  examDate: Date
  daysLeft: number
  completionPct: number
  colorAccent: string
}

export interface HeatmapEntry {
  topicId: string
  topicTitle: string
  examTitle: string
  masteryLevel: number
  difficulty: number
  priority: number
  lastStudied?: Date
}

// API response wrappers
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// AI Chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface StudyContext {
  exams: Array<{
    title: string
    examDate?: string
    completionPct: number
    weakTopics: string[]
    upcomingTopics: string[]
  }>
  streak: number
  recentActivity: string
  totalStudyTime: string
}
