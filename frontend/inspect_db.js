const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectDb() {
  console.log('=== DATABASE CONTENT INSPECTION ===');
  
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log(`\nUsers (${users.length}):`, JSON.stringify(users, null, 2));

  const exams = await prisma.exam.findMany({
    include: { _count: { select: { topics: true, studyPlans: true } } }
  });
  console.log(`\nExams (${exams.length}):`, JSON.stringify(exams.map(e => ({
    id: e.id,
    userId: e.userId,
    title: e.title,
    examDate: e.examDate,
    topicsCount: e._count.topics,
    plansCount: e._count.studyPlans
  })), null, 2));

  const plans = await prisma.studyPlan.findMany({
    include: {
      exam: { select: { title: true } },
      _count: { select: { tasks: true } }
    }
  });
  console.log(`\nStudyPlans (${plans.length}):`, JSON.stringify(plans.map(p => ({
    id: p.id,
    examId: p.examId,
    examTitle: p.exam.title,
    isActive: p.isActive,
    generatedAt: p.generatedAt,
    validUntil: p.validUntil,
    taskCount: p._count.tasks,
    schedulePreview: typeof p.schedule === 'object' ? Object.keys(p.schedule || {}) : typeof p.schedule
  })), null, 2));

  const tasks = await prisma.planTask.findMany({ take: 10 });
  console.log(`\nPlanTasks Total Count:`, await prisma.planTask.count());
  console.log(`PlanTasks Sample (first 10):`, JSON.stringify(tasks, null, 2));

  const insights = await prisma.aIInsight.findMany();
  console.log(`\nAIInsights Count:`, insights.length);

  const logs = await prisma.progressLog.findMany();
  console.log(`\nProgressLogs Count:`, logs.length);

  const sessions = await prisma.studySession.findMany();
  console.log(`\nStudySessions Count:`, sessions.length);

  await prisma.$disconnect();
}

inspectDb().catch(e => {
  console.error(e);
  process.exit(1);
});
