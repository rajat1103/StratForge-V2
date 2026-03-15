import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await prisma.checklistItem.findFirst({
    where: { id: params.id, topic: { exam: { userId: session.userId } } },
  })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const updated = await prisma.checklistItem.update({
    where: { id: params.id },
    data: {
      completed: !item.completed,
      completedAt: !item.completed ? new Date() : null,
    },
  })

  // Recalculate topic mastery from checklist completion
  const allItems = await prisma.checklistItem.findMany({ where: { topicId: item.topicId } })
  const completedCount = allItems.filter((i: typeof allItems[0]) => i.id === params.id ? !item.completed : i.completed).length
  const checklistMastery = allItems.length > 0 ? completedCount / allItems.length : 0

  await prisma.topic.update({
    where: { id: item.topicId },
    data: {
      masteryLevel: { set: Math.max(checklistMastery * 0.6, 0) },
      status: checklistMastery === 1 ? 'completed' : checklistMastery > 0 ? 'in_progress' : 'not_started',
    },
  })

  return NextResponse.json({ data: updated })
}
