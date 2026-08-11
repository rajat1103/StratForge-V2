import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding StratForge database with dynamic relative dates...')

  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@stratforge.app' },
    update: {},
    create: {
      email: 'demo@stratforge.app',
      name: 'Alex Chen',
      passwordHash,
      theme: 'dark',
      preferences: { notifications: true, dailyReminder: '09:00' },
    },
  })

  // Dynamic relative dates based on current execution time
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const jeeExamDate = new Date(today.getTime() + 75 * 86400000) // 75 days in future
  const awsExamDate = new Date(today.getTime() + 45 * 86400000) // 45 days in future

  // Streak
  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {
      currentStreak: 12,
      longestStreak: 24,
      totalStudyDays: 47,
      lastActiveDate: today,
    },
    create: {
      userId: user.id,
      currentStreak: 12,
      longestStreak: 24,
      totalStudyDays: 47,
      lastActiveDate: today,
    },
  })

  // Delete existing exams to prevent duplicate stale exams
  await prisma.exam.deleteMany({ where: { userId: user.id } })

  // Exam 1: JEE Advanced
  const jeeExam = await prisma.exam.create({
    data: {
      userId: user.id,
      title: 'JEE Advanced 2026',
      type: 'competitive',
      examDate: jeeExamDate,
      description: 'Joint Entrance Examination for IITs',
      theme: 'engineering',
      colorAccent: '#00D4FF',
      completionPct: 34,
    },
  })

  const jeeTopics = [
    { title: 'Mechanics', difficulty: 4, priority: 5, estimatedDays: 14, masteryLevel: 0.72, status: 'in_progress', order: 1 },
    { title: 'Thermodynamics', difficulty: 4, priority: 4, estimatedDays: 10, masteryLevel: 0.45, status: 'in_progress', order: 2 },
    { title: 'Electromagnetism', difficulty: 5, priority: 5, estimatedDays: 18, masteryLevel: 0.28, status: 'not_started', order: 3 },
    { title: 'Optics', difficulty: 3, priority: 3, estimatedDays: 8, masteryLevel: 0.60, status: 'in_progress', order: 4 },
    { title: 'Organic Chemistry', difficulty: 5, priority: 5, estimatedDays: 20, masteryLevel: 0.15, status: 'not_started', order: 5 },
    { title: 'Physical Chemistry', difficulty: 4, priority: 4, estimatedDays: 15, masteryLevel: 0.40, status: 'in_progress', order: 6 },
    { title: 'Inorganic Chemistry', difficulty: 3, priority: 3, estimatedDays: 12, masteryLevel: 0.55, status: 'in_progress', order: 7 },
    { title: 'Calculus', difficulty: 4, priority: 5, estimatedDays: 16, masteryLevel: 0.80, status: 'completed', order: 8 },
    { title: 'Algebra & Matrices', difficulty: 3, priority: 4, estimatedDays: 10, masteryLevel: 0.90, status: 'completed', order: 9 },
    { title: 'Coordinate Geometry', difficulty: 3, priority: 3, estimatedDays: 8, masteryLevel: 0.65, status: 'in_progress', order: 10 },
  ]

  for (const topicData of jeeTopics) {
    const topic = await prisma.topic.create({
      data: { examId: jeeExam.id, ...topicData },
    })
    await prisma.checklistItem.createMany({
      data: [
        { topicId: topic.id, label: 'Read theory & concepts', completed: topicData.masteryLevel > 0.3, order: 1 },
        { topicId: topic.id, label: 'Solve textbook problems', completed: topicData.masteryLevel > 0.5, order: 2 },
        { topicId: topic.id, label: 'Practice previous year questions', completed: topicData.masteryLevel > 0.7, order: 3 },
        { topicId: topic.id, label: 'Take topic test', completed: topicData.masteryLevel > 0.85, order: 4 },
        { topicId: topic.id, label: 'Review weak areas', completed: false, order: 5 },
      ],
    })
  }

  // Exam 2: AWS Solutions Architect
  const awsExam = await prisma.exam.create({
    data: {
      userId: user.id,
      title: 'AWS Solutions Architect',
      type: 'certification',
      examDate: awsExamDate,
      description: 'AWS Certified Solutions Architect - Associate',
      theme: 'programming',
      colorAccent: '#FF9500',
      completionPct: 58,
    },
  })

  const awsTopics = [
    { title: 'IAM & Security', difficulty: 3, priority: 5, estimatedDays: 5, masteryLevel: 0.88, status: 'completed', order: 1 },
    { title: 'EC2 & Compute', difficulty: 3, priority: 5, estimatedDays: 6, masteryLevel: 0.82, status: 'completed', order: 2 },
    { title: 'S3 & Storage', difficulty: 2, priority: 4, estimatedDays: 4, masteryLevel: 0.75, status: 'completed', order: 3 },
    { title: 'VPC & Networking', difficulty: 4, priority: 5, estimatedDays: 8, masteryLevel: 0.50, status: 'in_progress', order: 4 },
    { title: 'RDS & Databases', difficulty: 3, priority: 4, estimatedDays: 5, masteryLevel: 0.40, status: 'in_progress', order: 5 },
    { title: 'Lambda & Serverless', difficulty: 4, priority: 4, estimatedDays: 6, masteryLevel: 0.30, status: 'not_started', order: 6 },
    { title: 'CloudFormation & IaC', difficulty: 4, priority: 3, estimatedDays: 5, masteryLevel: 0.20, status: 'not_started', order: 7 },
    { title: 'High Availability & DR', difficulty: 4, priority: 5, estimatedDays: 6, masteryLevel: 0.15, status: 'not_started', order: 8 },
  ]

  for (const topicData of awsTopics) {
    const topic = await prisma.topic.create({
      data: { examId: awsExam.id, ...topicData },
    })
    await prisma.checklistItem.createMany({
      data: [
        { topicId: topic.id, label: 'Read AWS documentation', completed: topicData.masteryLevel > 0.2, order: 1 },
        { topicId: topic.id, label: 'Watch video course', completed: topicData.masteryLevel > 0.4, order: 2 },
        { topicId: topic.id, label: 'Hands-on lab practice', completed: topicData.masteryLevel > 0.6, order: 3 },
        { topicId: topic.id, label: 'Practice exam questions', completed: topicData.masteryLevel > 0.8, order: 4 },
      ],
    })
  }

  // Sample progress logs & study sessions (last 14 days)
  const allTopics = await prisma.topic.findMany({ where: { exam: { userId: user.id } } })

  for (let i = 13; i >= 0; i--) {
    const logDate = new Date(today)
    logDate.setDate(today.getDate() - i)

    const topicsForDay = allTopics.slice(0, Math.floor(Math.random() * 3) + 1)
    for (const topic of topicsForDay) {
      const minutesSpent = Math.floor(Math.random() * 90) + 30
      const score = Math.floor(Math.random() * 40) + 50
      const sessionType = ['study', 'revision', 'practice'][Math.floor(Math.random() * 3)]

      await prisma.progressLog.create({
        data: {
          topicId: topic.id,
          userId: user.id,
          score,
          minutesSpent,
          logDate,
          sessionType,
        },
      })

      await prisma.studySession.create({
        data: {
          userId: user.id,
          topicId: topic.id,
          startedAt: logDate,
          endedAt: new Date(logDate.getTime() + minutesSpent * 60000),
          durationMins: minutesSpent,
          focusScore: Math.floor(Math.random() * 3) + 7, // 7-10
          mode: 'pomodoro',
          notes: 'Seeded focus session',
        },
      })
    }
  }

  // Create initial study plans for both exams starting TODAY
  for (const exam of [jeeExam, awsExam]) {
    const examTopics = await prisma.topic.findMany({ where: { examId: exam.id }, orderBy: { order: 'asc' } })
    
    const tasksData: any[] = []
    const dailySchedule: any[] = []

    for (let dayIdx = 0; dayIdx < 14; dayIdx++) {
      const taskDate = new Date(today)
      taskDate.setDate(today.getDate() + dayIdx)
      const topic = examTopics[dayIdx % examTopics.length]

      dailySchedule.push({
        date: taskDate.toISOString().split('T')[0],
        tasks: [{
          topicId: topic.id,
          topicTitle: topic.title,
          durationMins: 60,
          taskType: topic.masteryLevel > 0.8 ? 'revision' : 'study',
        }],
        totalMins: 60,
      })
    }

    const plan = await prisma.studyPlan.create({
      data: {
        examId: exam.id,
        schedule: {
          dailySchedule,
          milestones: [{ date: jeeExamDate.toISOString().split('T')[0], title: 'Exam Readiness Target', topicsCompleted: examTopics.slice(0, 3).map(t => t.title) }],
          insights: ['Focus on weak topics first', 'Maintain daily study consistency'],
          estimatedCompletion: jeeExamDate.toISOString().split('T')[0],
          weeklyHours: 28,
          recommendedOrder: examTopics.map(t => t.title),
        },
        validUntil: exam.examDate,
        isActive: true,
      },
    })

    for (let dayIdx = 0; dayIdx < 14; dayIdx++) {
      const taskDate = new Date(today)
      taskDate.setDate(today.getDate() + dayIdx)
      const topic = examTopics[dayIdx % examTopics.length]

      tasksData.push({
        planId: plan.id,
        topicId: topic.id,
        scheduledDate: taskDate,
        durationMins: 60,
        completed: dayIdx < 2, // First 2 tasks completed
        taskType: topic.masteryLevel > 0.8 ? 'revision' : 'study',
        completedAt: dayIdx < 2 ? taskDate : null,
      })
    }

    await prisma.planTask.createMany({ data: tasksData })
  }

  // AI Insights with relative dates
  const jeeExamDateStr = jeeExamDate.toISOString().split('T')[0]
  await prisma.aIInsight.createMany({
    data: [
      {
        userId: user.id,
        insightType: 'weak_topic',
        title: 'Organic Chemistry needs attention',
        content: 'You have 15% mastery in Organic Chemistry with 20 estimated days remaining. Consider increasing daily time by 45 minutes.',
        payload: { topicId: jeeTopics[4].title, suggestedAction: 'increase_time', urgency: 'high' },
        priority: 1,
      },
      {
        userId: user.id,
        insightType: 'prediction',
        title: 'JEE Advanced readiness: 52%',
        content: 'Based on your current progress velocity, you will reach 85% readiness before your exam date.',
        payload: { readinessScore: 52, examDate: jeeExamDateStr },
        priority: 1,
      },
      {
        userId: user.id,
        insightType: 'schedule_suggestion',
        title: 'Optimal study window: 9 PM – 11 PM',
        content: 'Your focus score is 23% higher during evening sessions. Consider scheduling your hardest topics during this window.',
        payload: { peakHours: ['21:00', '23:00'], avgFocusScore: 8.2 },
        priority: 2,
      },
      {
        userId: user.id,
        insightType: 'motivation',
        title: '12-day streak! You are on fire 🔥',
        content: 'You have studied every day for 12 consecutive days. You are in the top 8% of StratForge users by consistency.',
        payload: { streakDays: 12, percentile: 92 },
        priority: 3,
      },
    ],
  })

  await prisma.exam.update({ where: { id: jeeExam.id }, data: { totalTopics: jeeTopics.length } })
  await prisma.exam.update({ where: { id: awsExam.id }, data: { totalTopics: awsTopics.length } })

  console.log('✅ Seed complete with dynamic future exam dates and initial active plans/tasks!')
  console.log('📧 Demo login: demo@stratforge.app / password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
