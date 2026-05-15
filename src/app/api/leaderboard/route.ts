import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? undefined;
  const projectId = searchParams.get('projectId') ?? undefined;

  const now = new Date();
  let startDate: Date | undefined;
  if (period === 'weekly') { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
  else if (period === 'monthly') { startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); }

  if (projectId) {
    const tasks = await prisma.task.findMany({
      where: { projectId, status: 'done', ...(startDate ? { completedAt: { gte: startDate } } : {}) },
      select: { assignedTo: true, xpReward: true },
    });
    const xpMap = new Map<string, number>();
    for (const task of tasks) {
      if (task.assignedTo) xpMap.set(task.assignedTo, (xpMap.get(task.assignedTo) || 0) + task.xpReward);
    }
    const users: { id: string; name: string | null; avatar: string | null; level: number }[] = await prisma.user.findMany({
      where: { id: { in: Array.from(xpMap.keys()) } },
      select: { id: true, name: true, avatar: true, level: true },
    });
    const leaderboard = users
      .map((u) => ({ ...u, periodXp: xpMap.get(u.id) || 0, taskCount: 0 }))
      .sort((a, b) => b.periodXp - a.periodXp);
    return NextResponse.json({ leaderboard });
  }

  if (startDate) {
    const transactions = await prisma.xpTransaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: { userId: true, amount: true },
    });
    const xpMap = new Map<string, number>();
    for (const tx of transactions) xpMap.set(tx.userId, (xpMap.get(tx.userId) || 0) + tx.amount);
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(xpMap.keys()) } },
      select: { id: true, name: true, avatar: true, level: true },
    });
    const leaderboard = users
      .map((u) => ({ ...u, periodXp: xpMap.get(u.id) || 0 }))
      .sort((a, b) => b.periodXp - a.periodXp)
      .slice(0, 50);
    return NextResponse.json({ leaderboard });
  }

  const users = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: 50,
    select: { id: true, name: true, avatar: true, xp: true, level: true },
  });
  return NextResponse.json({ leaderboard: users.map((u) => ({ ...u, periodXp: u.xp })) });
}
