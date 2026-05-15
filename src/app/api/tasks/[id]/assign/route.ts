import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const { assignedTo } = await req.json() as { assignedTo: string | null };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId } },
  });
  if (!member) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });

  const updated = await prisma.task.update({
    where: { id },
    data: { assignedTo },
    include: { assignee: { select: { id: true, name: true, avatar: true } } },
  });

  if (assignedTo && assignedTo !== userId) {
    await createNotification(assignedTo, 'task_assigned', `Sana bir görev atandı: "${task.title}"`);
  }

  return NextResponse.json({ task: updated });
}
