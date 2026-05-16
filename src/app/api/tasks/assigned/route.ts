import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const tasks = await prisma.task.findMany({
    where: { assignedTo: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, status: true, priority: true, xpReward: true, deadline: true,
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ tasks });
}
