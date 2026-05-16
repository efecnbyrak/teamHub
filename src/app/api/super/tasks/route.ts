import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

async function requireSuperAdmin(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'super_admin') return null;
  return userId;
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return unauthorized();

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, status: true, priority: true, xpReward: true, createdAt: true, deadline: true,
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, firstName: true, lastName: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ tasks });
}
