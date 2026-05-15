import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';
import { xpForPriority } from '@/lib/xp';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const assignedTo = searchParams.get('assignedTo') ?? undefined;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) return NextResponse.json({ error: 'Bu projeye erişim yetkiniz yok' }, { status: 403 });

  const tasks = await prisma.task.findMany({
    where: { projectId, ...(status ? { status } : {}), ...(assignedTo ? { assignedTo } : {}) },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { projectId } = await params;
  const { title, description, priority, assignedTo, deadline } =
    await req.json() as { title: string; description?: string; priority?: string; assignedTo?: string; deadline?: string };

  if (!title) return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) return NextResponse.json({ error: 'Bu projeye erişim yetkiniz yok' }, { status: 403 });

  const resolvedPriority = priority || 'medium';
  const task = await prisma.task.create({
    data: {
      projectId, title, description,
      priority: resolvedPriority,
      xpReward: xpForPriority(resolvedPriority),
      assignedTo,
      createdBy: userId,
      deadline: deadline ? new Date(deadline) : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (assignedTo && assignedTo !== userId) {
    await createNotification(assignedTo, 'task_assigned', `Sana yeni bir görev atandı: "${title}"`);
  }

  return NextResponse.json({ task }, { status: 201 });
}
