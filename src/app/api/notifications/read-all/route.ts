import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return NextResponse.json({ success: true });
}
