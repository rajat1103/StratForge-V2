import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const task = await prisma.planTask.findFirst({
      where: {
        id: params.id,
        plan: { exam: { userId: session.userId } },
      },
    })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const updated = await prisma.planTask.update({
      where: { id: params.id },
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
      include: { topic: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PLAN_TASK_PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
