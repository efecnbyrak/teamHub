import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { period, projectId } = req.query as { period?: string; projectId?: string };

  let startDate: Date | undefined;
  const now = new Date();

  if (period === 'weekly') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  }

  if (projectId) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        status: 'done',
        ...(startDate ? { completedAt: { gte: startDate } } : {}),
      },
      select: { assignedTo: true, xpReward: true },
    });

    const xpMap = new Map<string, number>();
    for (const task of tasks) {
      if (task.assignedTo) {
        xpMap.set(task.assignedTo, (xpMap.get(task.assignedTo) || 0) + task.xpReward);
      }
    }

    const userIds = Array.from(xpMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, level: true },
    });

    const leaderboard = users
      .map((u) => ({ ...u, periodXp: xpMap.get(u.id) || 0, taskCount: 0 }))
      .sort((a, b) => b.periodXp - a.periodXp);

    res.json({ leaderboard });
    return;
  }

  if (startDate) {
    const transactions = await prisma.xpTransaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: { userId: true, amount: true },
    });

    const xpMap = new Map<string, number>();
    for (const tx of transactions) {
      xpMap.set(tx.userId, (xpMap.get(tx.userId) || 0) + tx.amount);
    }

    const userIds = Array.from(xpMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, level: true },
    });

    const leaderboard = users
      .map((u) => ({ ...u, periodXp: xpMap.get(u.id) || 0 }))
      .sort((a, b) => b.periodXp - a.periodXp)
      .slice(0, 50);

    res.json({ leaderboard });
    return;
  }

  const users = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: 50,
    select: { id: true, name: true, avatar: true, xp: true, level: true },
  });

  res.json({ leaderboard: users.map((u) => ({ ...u, periodXp: u.xp })) });
});

export default router;
