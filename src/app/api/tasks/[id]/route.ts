import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';
import { xpForPriority, awardXp } from '@/lib/xp';
import { createNotification } from '@/lib/notifications';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const { title, description, priority, deadline, status } =
    await req.json() as { title?: string; description?: string; priority?: string; deadline?: string; status?: string };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId } },
  });
  if (!member) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });

  const wasCompleted = task.status === 'done';
  const isNowCompleted = status === 'done';
  const completedAt = isNowCompleted && !wasCompleted ? new Date() : task.completedAt;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority ? { priority, xpReward: xpForPriority(priority) } : {}),
      ...(deadline ? { deadline: new Date(deadline) } : {}),
      ...(status ? { status } : {}),
      completedAt,
    },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (isNowCompleted && !wasCompleted) {
    const targetUserId = task.assignedTo || userId;
    const { newLevel, leveledUp } = await awardXp(targetUserId, updated.xpReward, 'task_completed', id);
    if (leveledUp) {
      await createNotification(targetUserId, 'level_up', `Tebrikler! ${newLevel}. seviyeye ulaştın! 🎉`);
    }
  }

  return NextResponse.json({ task: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId } },
  });
  if (!member) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
