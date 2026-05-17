import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId, read: false } });
  return NextResponse.json({ notifications, unreadCount });
}
