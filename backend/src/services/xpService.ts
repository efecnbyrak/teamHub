import prisma from '../lib/prisma';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= (LEVEL_THRESHOLDS[i] ?? 0)) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForPriority(priority: string): number {
  if (priority === 'high') return 50;
  if (priority === 'low') return 10;
  return 25;
}

export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  taskId?: string
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const prevLevel = user.level;
  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    }),
    prisma.xpTransaction.create({
      data: { userId, amount, reason, taskId },
    }),
  ]);

  return { newXp, newLevel, leveledUp: newLevel > prevLevel };
}
